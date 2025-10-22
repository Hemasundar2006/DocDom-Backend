require('dotenv').config();
const mongoose = require('mongoose');
const College = require('../models/College');

// Sample colleges with their email domains
const colleges = [

  
  {
    name: 'Qis College Of Engineering And Technology',
    domain: 'qiscet.edu.in'
  },
  {
    name: 'Gayatri Vidya Parishad College for Degree & P.G. Courses',
    domain: 'gvp.ac.in'
  }
];

// Connect to MongoDB and seed data
const seedColleges = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');

    // Clear existing colleges (optional - comment out to preserve existing data)
    await College.deleteMany({});
    console.log('Cleared existing colleges');

    // Insert new colleges
    const createdColleges = await College.insertMany(colleges);
    console.log(`✓ Successfully seeded ${createdColleges.length} colleges`);

    // Display seeded colleges
    console.log('\nSeeded Colleges:');
    createdColleges.forEach((college, index) => {
      console.log(`${index + 1}. ${college.name} (@${college.domain})`);
    });

    console.log('\nSeeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding colleges:', error);
    process.exit(1);
  }
};

// Run the seed function
seedColleges();

