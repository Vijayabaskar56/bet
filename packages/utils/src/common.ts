import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import { s3 } from "./multer";

export const unLinkExistImage = async (key: string) => {
	try {
		const data = await s3.delete(key);
		console.log("Exist image deleted successfully!");
		return data;
	} catch (err) {
		console.log("Oops! Failed to delete Exist image..!");
		return "Unlink failed";
	}
};

export const convertToCSV = (data: any) => {
	try {
		const parser = new Parser();
		const csv = parser.parse(data);
		return csv;
	} catch (err) {
		console.error("Error converting to CSV:", err);
	}
};

export const convertToExcel = (data: any) => {
	try {
		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.json_to_sheet(data);
		XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
		const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
		return excelBuffer;
	} catch (err) {
		console.error("Error converting to Excel:", err);
	}
};

export const convertToPDF = (data: any): Promise<Buffer> => {
	return new Promise((resolve) => {
		const doc = new PDFDocument();
		const buffers: Buffer[] = [];

		doc.on("data", (chunk) => buffers.push(chunk));
		doc.on("end", () => {
			const pdfBuffer = Buffer.concat(buffers);
			resolve(pdfBuffer);
		});

		doc.fontSize(25).text("This is a PDF content", 100, 100);

		if (data && Array.isArray(data)) {
			data.forEach((item, index) => {
				doc.fontSize(12).text(`${index + 1}: ${item}`, 100, 150 + index * 20);
			});
		}

		doc.end();
	});
};

export const downloadRecord = async (
	type: "pdf" | "xlsx" | "csv",
	data: any,
) => {
	if (type === "pdf") {
		return await convertToPDF(data);
	}
	if (type === "xlsx") {
		return await convertToExcel(data);
	}
	if (type === "csv") {
		return await convertToCSV(data);
	}
	throw new Error("Unsupported file type");
};
