const fs = require('fs');

const cities = [
    "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", 
    "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", 
    "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", 
    "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara"
];
const specializations = ["Cardiologist", "Dermatologist", "Neurologist", "Pediatrician", "Oncologist", "Psychiatrist", "Orthopedic Surgeon", "General Practitioner", "Gastroenterologist", "Endocrinologist"];
const firstNames = [
    "Aarav", "Vihaan", "Aditya", "Arjun", "Sai", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharv",
    "Diya", "Aadhya", "Ananya", "Sara", "Kavya", "Khushi", "Riya", "Avni", "Mahi", "Meera",
    "Rahul", "Rohan", "Vikram", "Suresh", "Ramesh", "Priya", "Neha", "Pooja", "Rajesh", "Amit",
    "Sanjay", "Ravi", "Sneha", "Kriti", "Shreya"
];
const lastNames = [
    "Sharma", "Verma", "Gupta", "Malhotra", "Singh", "Patel", "Kumar", "Desai", "Rao", "Joshi",
    "Nair", "Iyer", "Menon", "Reddy", "Chowdhury", "Das", "Mukherjee", "Bose", "Ghosh", "Yadav",
    "Tiwari", "Ahluwalia", "Agarwal", "Bhatia", "Kapoor"
];

const getRand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const mockDoctors = [];
let idCounter = 1;

for (const city of cities) {
    const numDoctors = Math.floor(Math.random() * 6) + 15; // 15 to 20 doctors
    for (let i = 0; i < numDoctors; i++) {
        const doc = {
            user_id: "mock_" + idCounter++,
            first_name: getRand(firstNames),
            second_name: getRand(lastNames),
            specialization: getRand(specializations),
            city: city,
            // INR consultation fees instead of USD
            consultationFees: Math.floor(Math.random() * 16) * 100 + 500, // 500 to 2000
            yearsOfExperience: Math.floor(Math.random() * 25) + 2, // 2 to 26
            profilePicture: `https://i.pravatar.cc/150?u=mock_ind_${idCounter}`
        };
        mockDoctors.push(doc);
    }
}

const fileContent = `export const MOCK_DOCTORS_EXTENDED = ${JSON.stringify(mockDoctors, null, 2)};`;
fs.writeFileSync('d:/Projects/patient-record/lib/utils/mockDoctors.ts', fileContent);
console.log("Mock file generated successfully.");
