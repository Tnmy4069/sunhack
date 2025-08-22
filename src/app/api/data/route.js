import connectToDatabase from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// READ - Get all data from all collections
export async function GET(request) {
  try {
    const mongoose = await connectToDatabase();
    const url = new URL(request.url);
    const collection = url.searchParams.get('collection');
    const id = url.searchParams.get('id');
    
    // Make sure we're using the sunhack database
    const sunhackDb = mongoose.connection.client.db('sunhack');

    
    if (collection && id) {
      // Get specific document by ID
      const data = await sunhackDb.collection(collection).findOne({ _id: new ObjectId(id) });
      return Response.json({ success: true, data });
    } else if (collection) {
      // Get all documents from specific collection
      const data = await sunhackDb.collection(collection).find({}).toArray();
      return Response.json({ success: true, data });
    } else {
      // Get all data from all collections
      const collections = await sunhackDb.listCollections().toArray();
      const allData = {};
      
      for (const col of collections) {
        const collectionName = col.name;
        const data = await sunhackDb.collection(collectionName).find({}).toArray();
        allData[collectionName] = data;
      }
      
      return Response.json({ success: true, data: allData });
    }
  } catch (error) {
    console.error('Database read error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// CREATE - Insert new document
export async function POST(request) {
  try {
    const mongoose = await connectToDatabase();
    const sunhackDb = mongoose.connection.client.db('sunhack');
    
    const body = await request.json();
    const { collection, data } = body;
    
    if (!collection || !data) {
      return Response.json({ success: false, error: 'Collection name and data are required' }, { status: 400 });
    }
    
    const result = await sunhackDb.collection(collection).insertOne(data);
    
    return Response.json({ 
      success: true, 
      message: 'Document created successfully',
      insertedId: result.insertedId 
    });
  } catch (error) {
    console.error('Database create error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// UPDATE - Update existing document
export async function PUT(request) {
  try {
    const mongoose = await connectToDatabase();
    const sunhackDb = mongoose.connection.client.db('sunhack');
    
    const body = await request.json();
    const { collection, id, data } = body;
    
    if (!collection || !id || !data) {
      return Response.json({ success: false, error: 'Collection name, ID, and data are required' }, { status: 400 });
    }
    
    const result = await sunhackDb.collection(collection).updateOne(
      { _id: new ObjectId(id) },
      { $set: data }
    );
    
    if (result.matchedCount === 0) {
      return Response.json({ success: false, error: 'Document not found' }, { status: 404 });
    }
    
    return Response.json({ 
      success: true, 
      message: 'Document updated successfully',
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Database update error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Delete document
export async function DELETE(request) {
  try {
    const mongoose = await connectToDatabase();
    const sunhackDb = mongoose.connection.client.db('sunhack');
    
    const body = await request.json();
    const { collection, id } = body;
    
    if (!collection || !id) {
      return Response.json({ success: false, error: 'Collection name and ID are required' }, { status: 400 });
    }
    
    const result = await sunhackDb.collection(collection).deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return Response.json({ success: false, error: 'Document not found' }, { status: 404 });
    }
    
    return Response.json({ 
      success: true, 
      message: 'Document deleted successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Database delete error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
