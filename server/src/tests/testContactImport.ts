/*
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

const API_URL = "http://localhost:5000/api"; // Adjust based on your environment
const TOKEN = "YOUR_AUTH_TOKEN"; // You'll need a way to get this for real testing

async function testImport() {
    const formData = new FormData();
    // Create a dummy CSV
    const csvContent = "Email,First Name,Last Name,Company\ntest@example.com,John,Doe,Example Corp";
    const csvPath = path.join(__dirname, "test_contacts.csv");
    fs.writeFileSync(csvPath, csvContent);

    formData.append("file", fs.createReadStream(csvPath));
    formData.append("mapping", JSON.stringify({
        email: "Email",
        firstName: "First Name",
        lastName: "Last Name",
        company: "Company"
    }));

    try {
        const response = await axios.post(`${API_URL}/contacts/import`, formData, {
            headers: {
                ...formData.getHeaders(),
                "Authorization": `Bearer ${TOKEN}`
            }
        });

        console.log("Response:", response.data);
    } catch (error: any) {
        console.error("Error:", error.response?.data || error.message);
    } finally {
        fs.unlinkSync(csvPath);
    }
}
*/

// testImport();
