import secrets
import argon2
from argon2 import Type
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from typing import Tuple

MAGIC_HEADER = b"ATOMS_ENC_V1"  # 12 bytes
SALT_LEN = 16                   # 16 bytes
NONCE_LEN = 12                  # 12 bytes
KEY_LEN = 32                    # 256-bit key for AES-256

def derive_argon2id_key(pin: str, salt: bytes) -> bytes:
    """
    Derives a 256-bit AES symmetric key from an input PIN/Passphrase using Argon2id.
    Parameters tuned for high work factor:
      - Type: Argon2id (Type.ID)
      - memory_cost: 65536 KiB (64 MB)
      - time_cost: 2 iterations
      - parallelism: 2 threads
      - hash_len: 32 bytes (256 bits)
    """
    if not pin:
        raise ValueError("PIN/Password cannot be empty")
    
    return argon2.low_level.hash_secret_raw(
        secret=pin.encode("utf-8"),
        salt=salt,
        time_cost=2,
        memory_cost=65536,
        parallelism=2,
        hash_len=KEY_LEN,
        type=Type.ID
    )

def encrypt_backup_payload(data: bytes, pin: str) -> bytes:
    """
    Encrypts arbitrary data using Argon2id KDF + AES-256-GCM.
    Binary envelope layout:
      [MAGIC_HEADER (12B)][SALT (16B)][NONCE (12B)][CIPHERTEXT + GCM_TAG (variable)]
    """
    if not isinstance(data, (bytes, bytearray)):
        raise TypeError("Data to encrypt must be bytes")

    salt = secrets.token_bytes(SALT_LEN)
    nonce = secrets.token_bytes(NONCE_LEN)

    key = derive_argon2id_key(pin, salt)
    aesgcm = AESGCM(key)

    # Associated authenticated data binds the magic header
    ciphertext = aesgcm.encrypt(nonce, data, MAGIC_HEADER)

    envelope = MAGIC_HEADER + salt + nonce + ciphertext
    return envelope

def decrypt_backup_payload(envelope: bytes, pin: str) -> bytes:
    """
    Decrypts an encrypted backup binary envelope with Argon2id KDF + AES-256-GCM.
    Validates:
      1. Magic header match.
      2. Envelope minimum size.
      3. Cryptographic integrity & authentication tag.
    Raises ValueError on PIN mismatch or corrupted/tampered file.
    """
    if len(envelope) < (len(MAGIC_HEADER) + SALT_LEN + NONCE_LEN + 16):
        raise ValueError("Invalid or corrupted backup file (file too short)")

    header = envelope[:len(MAGIC_HEADER)]
    if header != MAGIC_HEADER:
        raise ValueError(f"Unsupported backup envelope header: {header.decode('ascii', errors='ignore')}")

    offset = len(MAGIC_HEADER)
    salt = envelope[offset : offset + SALT_LEN]
    offset += SALT_LEN

    nonce = envelope[offset : offset + NONCE_LEN]
    offset += NONCE_LEN

    ciphertext = envelope[offset:]

    key = derive_argon2id_key(pin, salt)
    aesgcm = AESGCM(key)

    try:
        decrypted_data = aesgcm.decrypt(nonce, ciphertext, MAGIC_HEADER)
        return decrypted_data
    except Exception as e:
        raise ValueError("Decryption failed: Incorrect PIN or tampered backup payload") from e
