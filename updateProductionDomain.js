require('dotenv').config();
const mongoose = require('mongoose');
const College = require('./models/College');

async function updateProductionDomain() {
  try {
    console.log('Connecting to production database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Update the college domain
    const result = await College.findOneAndUpdate(
      { name: 'Qis College Of Engineering And Technology' },
      { domain: 'qiscet.edu.in' },
      { new: true }
    );
    
    if (result) {
      console.log('✅ Successfully updated college domain:');
      console.log(`   Name: ${result.name}`);
      console.log(`   Domain: ${result.domain}`);
    } else {
      console.log('❌ College not found');
    }
    
    // Verify all colleges
    const colleges = await College.find({}, 'name domain');
    console.log('\n📋 All colleges:');
    colleges.forEach(college => {
      console.log(`   ${college.name} - ${college.domain}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateProductionDomain();
