from app import helpers, database


def aggregate_data(db_data, aggregator):
    if aggregator is None:
        return db_data
    else:
        keys = map(aggregator, db_data)
        return dict(zip(keys, db_data))


def process_data(db_data, processor):
    if processor is not None:
        map(processor, db_data)
    return db_data


def get_data(query, cache_class, key, aggregator=None, processor=None, cache=True, cache_type="Memory"):
    from_cache = False
    data = None
    if cache:
        data = helpers.get_cache(key)
        if data is not None:
            from_cache = True

    if not from_cache:
        data = map(cache_class, query())
        database.session.commit()
        data = process_data(data, processor)
        data = aggregate_data(data, aggregator)
        helpers.set_cache(key, data)

    return data
