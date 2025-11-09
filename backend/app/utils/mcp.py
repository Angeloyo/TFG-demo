import logging
from fastmcp import FastMCP
from app.utils.mongo import get_db

# Configurar logging básico
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

# Crear servidor MCP
mcp = FastMCP(
    name="MIMIC-IV MCP Server",
    instructions="This server provides tools to interact with the MIMIC-IV clinical database.",
    stateless_http=True
)

@mcp.tool(output_schema=None)
def get_schema(collection: str) -> dict:
    """Get the schema/structure of a MongoDB collection"""
    logging.info(f"get_schema called for collection: {collection}")
    try:
        db = get_db()
        coll = db[collection]
        
        sample = coll.find_one({}, max_time_ms=10000)
        if not sample:
            logging.warning(f"Collection {collection} is empty")
            return {"error": f"Collection {collection} is empty"}
        
        schema = {}
        for field, value in sample.items():
            schema[field] = type(value).__name__
        
        logging.info(f"Schema for collection {collection}: {schema}")
        return {"collection": collection, "schema": schema}
    except Exception as e:
        logging.error(f"Error getting schema for {collection}: {str(e)}")
        return {"error": f"Error getting schema for {collection}: {str(e)}"}

@mcp.tool(output_schema=None)
def find_documents(collection: str, query: dict = {}, limit: int = 10) -> dict:
    """Find documents in a MongoDB collection"""
    logging.info(f"find_documents called for collection: {collection}, query: {query}, limit: {limit}")
    try:
        db = get_db()
        coll = db[collection]
        
        documents = list(coll.find(query).limit(limit).max_time_ms(60000))
        logging.info(f"Found {len(documents)} documents in collection {collection}")
        return {"documents": documents, "collection": collection, "limit": limit, "count": len(documents)}
    except Exception as e:
        logging.error(f"Error finding documents in {collection}: {str(e)}")
        return {"error": f"Error finding documents in {collection}: {str(e)}"}

@mcp.tool(output_schema=None)
def aggregate_data(collection: str, pipeline: list) -> dict:
    """Run aggregation pipeline on MongoDB collection"""
    logging.info(f"aggregate_data called for collection: {collection}, pipeline: {pipeline}")
    try:
        db = get_db()
        coll = db[collection]
        
        results = list(coll.aggregate(pipeline, maxTimeMS=60000))
        logging.info(f"Aggregation returned {len(results)} results for collection {collection}")
        return {"results": results, "collection": collection, "count": len(results)}
    except Exception as e:
        logging.error(f"Error in aggregation on {collection}: {str(e)}")
        return {"error": f"Error in aggregation on {collection}: {str(e)}"}

@mcp.tool(output_schema=None)
def count_documents(collection: str, query: dict = {}) -> dict:
    """Count documents in a MongoDB collection"""
    logging.info(f"count_documents called for collection: {collection}, query: {query}")
    try:
        db = get_db()
        coll = db[collection]
        
        count = coll.count_documents(query, maxTimeMS=60000)
        logging.info(f"Counted {count} documents in collection {collection}")
        return {"count": count, "collection": collection}
    except Exception as e:
        logging.error(f"Error counting documents in {collection}: {str(e)}")
        return {"error": f"Error counting documents in {collection}: {str(e)}"}

@mcp.tool(output_schema=None)
def list_collections() -> dict:
    """List all collections in the MIMIC-IV database"""
    logging.info("list_collections called")
    try:
        db = get_db()
        collections = db.list_collection_names()
        logging.info(f"Collections found: {collections}")
        return {"collections": collections, "total": len(collections)}
    except Exception as e:
        logging.error(f"Error listing collections: {str(e)}")
        return {"error": f"Error listing collections: {str(e)}"}

@mcp.tool(output_schema=None)
def get_indexes(collection: str) -> dict:
    """Get index information for a MongoDB collection"""
    logging.info(f"get_indexes called for collection: {collection}")
    try:
        db = get_db()
        coll = db[collection]
        
        indexes = list(coll.list_indexes())
        logging.info(f"Indexes for collection {collection}: {indexes}")
        return {"collection": collection, "indexes": indexes}
    except Exception as e:
        logging.error(f"Error getting indexes for {collection}: {str(e)}")
        return {"error": f"Error getting indexes for {collection}: {str(e)}"}


# if __name__ == "__main__":
#     logging.info("Starting MIMIC-IV MCP Server...")
#     mcp.run(
#         transport="http", 
#         host="0.0.0.0", 
#         port=9000,
#     )