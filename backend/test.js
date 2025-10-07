const { MongoClient } = require('mongodb');


const SOURCE_DB_URL = 'mongodb://cmsptit:cmsptit22RSAD@160.191.237.191:27017/pticms?authSource=admin';
const TARGET_DB_URL = 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.4.2';
const SOURCE_DB_NAME = 'pticms';
const TARGET_DB_NAME = 'pticms'; 

(async () => {
  try {
    
    const sourceClient = new MongoClient(SOURCE_DB_URL);
    const targetClient = new MongoClient(TARGET_DB_URL);
    
    await sourceClient.connect();
    await targetClient.connect();
    
    console.log('Đã kết nối tới cả 2 server MongoDB!');

    const sourceDb = sourceClient.db(SOURCE_DB_NAME);
    const targetDb = targetClient.db(TARGET_DB_NAME);

    
    const collections = await sourceDb.listCollections().toArray();

    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`Đang copy collection: ${collectionName}...`);

      const documents = await sourceDb.collection(collectionName).find().toArray();
      
      if (documents.length > 0) {
        await targetDb.collection(collectionName).insertMany(documents);
        console.log(`Đã copy ${documents.length} documents từ ${collectionName}`);
      } else {
        console.log(`Collection ${collectionName} trống, bỏ qua.`);
      }
    }

    console.log('Hoàn tất copy database!');
  } catch (error) {
    console.error('Lỗi:', error);
  } finally {
    
    await sourceClient.close();
    await targetClient.close();
    process.exit(0);
  }
})();
