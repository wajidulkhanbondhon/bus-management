from sqlalchemy.future import select
from sqlalchemy import func

class AsyncQueryWrapper:
    def __init__(self, session, *entities):
        self.session = session
        # If the first entity is an instrumented attribute (like func.count(Model.id)), select(*entities) works.
        self.stmt = select(*entities)
        
    def filter(self, *args, **kwargs):
        self.stmt = self.stmt.filter(*args, **kwargs)
        return self
        
    def order_by(self, *args, **kwargs):
        self.stmt = self.stmt.order_by(*args, **kwargs)
        return self

    def limit(self, *args, **kwargs):
        self.stmt = self.stmt.limit(*args, **kwargs)
        return self
        
    def offset(self, *args, **kwargs):
        self.stmt = self.stmt.offset(*args, **kwargs)
        return self

    def join(self, *args, **kwargs):
        self.stmt = self.stmt.join(*args, **kwargs)
        return self
        
    def group_by(self, *args, **kwargs):
        self.stmt = self.stmt.group_by(*args, **kwargs)
        return self

    def outerjoin(self, *args, **kwargs):
        self.stmt = self.stmt.outerjoin(*args, **kwargs)
        return self
        
    def with_for_update(self, *args, **kwargs):
        self.stmt = self.stmt.with_for_update(*args, **kwargs)
        return self

    async def all(self):
        result = await self.session.execute(self.stmt)
        return result.scalars().all()
        
    async def first(self):
        result = await self.session.execute(self.stmt)
        return result.scalars().first()
        
    async def scalar(self):
        result = await self.session.execute(self.stmt)
        return result.scalar()
        
    async def count(self):
        count_stmt = select(func.count()).select_from(self.stmt.subquery())
        result = await self.session.execute(count_stmt)
        return result.scalar()

class WrappedAsyncSession:
    def __init__(self, async_session):
        self.async_session = async_session
        
    def query(self, *entities):
        return AsyncQueryWrapper(self.async_session, *entities)
        
    def add(self, instance):
        self.async_session.add(instance)

    async def add_all(self, instances):
        self.async_session.add_all(instances)

    async def delete(self, instance):
        return await self.async_session.delete(instance)

    async def flush(self):
        await self.async_session.flush()

    async def commit(self):
        await self.async_session.commit()

    async def rollback(self):
        await self.async_session.rollback()

    async def close(self):
        await self.async_session.close()

    async def refresh(self, instance):
        await self.async_session.refresh(instance)

    async def execute(self, stmt):
        return await self.async_session.execute(stmt)
