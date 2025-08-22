// CRUD Helper Functions for MongoDB operations

const API_BASE_URL = '/api/data';

// CREATE - Add new document to collection
export async function createDocument(collection, data) {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ collection, data }),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating document:', error);
    return { success: false, error: error.message };
  }
}

// READ - Get all documents from a collection
export async function getDocuments(collection = null, id = null) {
  try {
    let url = API_BASE_URL;
    console.log(url)
    const params = new URLSearchParams();
    
    if (collection) params.append('collection', collection);
    if (id) params.append('id', id);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching documents:', error);
    return { success: false, error: error.message };
  }
}

// UPDATE - Update document by ID
export async function updateDocument(collection, id, data) {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ collection, id, data }),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating document:', error);
    return { success: false, error: error.message };
  }
}

// DELETE - Delete document by ID
export async function deleteDocument(collection, id) {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ collection, id }),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting document:', error);
    return { success: false, error: error.message };
  }
}

// BULK OPERATIONS

// Create multiple documents at once
export async function createMultipleDocuments(collection, documents) {
  try {
    const results = await Promise.all(
      documents.map(doc => createDocument(collection, doc))
    );
    return results;
  } catch (error) {
    console.error('Error creating multiple documents:', error);
    return { success: false, error: error.message };
  }
}

// Delete multiple documents
export async function deleteMultipleDocuments(collection, ids) {
  try {
    const results = await Promise.all(
      ids.map(id => deleteDocument(collection, id))
    );
    return results;
  } catch (error) {
    console.error('Error deleting multiple documents:', error);
    return { success: false, error: error.message };
  }
}

// UTILITY FUNCTIONS

// Get all collection names
export async function getCollectionNames() {
  try {
    const result = await getDocuments();
    if (result.success && result.data) {
      return Object.keys(result.data);
    }
    return [];
  } catch (error) {
    console.error('Error getting collection names:', error);
    return [];
  }
}

// Count documents in a collection
export async function countDocuments(collection) {
  try {
    const result = await getDocuments(collection);
    if (result.success && Array.isArray(result.data)) {
      return result.data.length;
    }
    return 0;
  } catch (error) {
    console.error('Error counting documents:', error);
    return 0;
  }
}
