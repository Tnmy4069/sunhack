// Test CRUD Operations Script
// This file demonstrates how to use the CRUD functions programmatically

import { 
  createDocument, 
  getDocuments, 
  updateDocument, 
  deleteDocument,
  createMultipleDocuments,
  deleteMultipleDocuments,
  getCollectionNames,
  countDocuments
} from './crudHelpers.js';

// Example usage of CRUD operations

async function testCRUDOperations() {
  console.log('Testing CRUD operations...\n');

  try {
    // 1. CREATE - Add new documents
    console.log('1. Creating documents...');
    
    const newUser = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      createdAt: new Date().toISOString()
    };
    
    const createResult = await createDocument('users', newUser);
    console.log('Create result:', createResult);
    
    const newPost = {
      title: 'My First Post',
      content: 'This is the content of my first post',
      author: 'John Doe',
      tags: ['tech', 'programming'],
      createdAt: new Date().toISOString()
    };
    
    const createPostResult = await createDocument('posts', newPost);
    console.log('Create post result:', createPostResult);

    // 2. READ - Get all data
    console.log('\n2. Reading all data...');
    const allData = await getDocuments();
    console.log('All collections:', Object.keys(allData.data));
    
    // Get specific collection
    const users = await getDocuments('users');
    console.log('Users count:', users.data.length);
    
    // Get collection names
    const collections = await getCollectionNames();
    console.log('Collection names:', collections);

    // 3. UPDATE - Modify existing document
    console.log('\n3. Updating document...');
    if (users.data.length > 0) {
      const firstUser = users.data[0];
      const updateData = { 
        age: 31, 
        lastUpdated: new Date().toISOString(),
        status: 'active'
      };
      
      const updateResult = await updateDocument('users', firstUser._id, updateData);
      console.log('Update result:', updateResult);
    }

    // 4. CREATE MULTIPLE - Bulk insert
    console.log('\n4. Creating multiple documents...');
    const multipleUsers = [
      { name: 'Jane Smith', email: 'jane@example.com', age: 25 },
      { name: 'Bob Wilson', email: 'bob@example.com', age: 35 },
      { name: 'Alice Brown', email: 'alice@example.com', age: 28 }
    ];
    
    const bulkCreateResult = await createMultipleDocuments('users', multipleUsers);
    console.log('Bulk create results:', bulkCreateResult.length, 'operations');

    // 5. COUNT DOCUMENTS
    console.log('\n5. Counting documents...');
    const userCount = await countDocuments('users');
    console.log('Total users:', userCount);

    // 6. DELETE - Remove document (commented out for safety)
    console.log('\n6. Delete operation available but skipped for safety');
    /*
    if (users.data.length > 1) {
      const userToDelete = users.data[users.data.length - 1];
      const deleteResult = await deleteDocument('users', userToDelete._id);
      console.log('Delete result:', deleteResult);
    }
    */

    console.log('\n✅ CRUD operations test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during CRUD operations:', error);
  }
}

// Example data structures for different collections
export const exampleData = {
  users: {
    name: 'string',
    email: 'string',
    age: 'number',
    createdAt: 'ISO date string',
    status: 'string (optional)'
  },
  posts: {
    title: 'string',
    content: 'string',
    author: 'string',
    tags: ['array', 'of', 'strings'],
    createdAt: 'ISO date string',
    published: 'boolean (optional)'
  },
  products: {
    name: 'string',
    description: 'string',
    price: 'number',
    category: 'string',
    inStock: 'boolean',
    createdAt: 'ISO date string'
  }
};

// Sample JSON data you can copy-paste for testing
export const sampleDocuments = {
  user: JSON.stringify({
    name: "Test User",
    email: "test@example.com",
    age: 25,
    createdAt: new Date().toISOString()
  }, null, 2),
  
  post: JSON.stringify({
    title: "Sample Blog Post",
    content: "This is a sample blog post content",
    author: "Test User",
    tags: ["sample", "test"],
    published: true,
    createdAt: new Date().toISOString()
  }, null, 2),
  
  product: JSON.stringify({
    name: "Sample Product",
    description: "This is a sample product",
    price: 29.99,
    category: "electronics",
    inStock: true,
    createdAt: new Date().toISOString()
  }, null, 2)
};

// Uncomment the line below to run the test when this file is imported
// testCRUDOperations();
