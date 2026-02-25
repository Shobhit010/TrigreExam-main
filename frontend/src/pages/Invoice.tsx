import React, { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const Invoice: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const invoiceRef = useRef<HTMLDivElement>(null);

    // Mock invoice data - in real app, this would be fetched based on orderId
    const invoiceData = {
        invoiceNumber: "INV-1023",
        orderId: orderId || "#ORD-00124",
        date: "25 Oct 2024",
        dueDate: "25 Nov 2024",
        status: "Paid",
        customer: {
            name: "Olivia John",
            email: "olivia@trigreexam.com",
            phone: "+91 98765 43210",
            address: "123 Main Street, New Delhi, 110001"
        },
        company: {
            name: "TrigreExam",
            email: "support@trigreexam.com",
            phone: "+91 11 1234 5678",
            address: "456 Education Hub, Connaught Place, New Delhi, 110001",
            gst: "29ABCDE1234F1Z5"
        },
        items: [
            {
                description: "SSC CGL Foundation Program (Comprehensive Preparation Course)",
                quantity: 1,
                price: 4999,
                total: 4999
            }
        ],
        subtotal: 4999,
        serviceCharge: 500,
        tax: 899.82,
        total: 6398.82 // 4999 + 500 + 899.82
    };

    const handleDownload = async () => {
        if (!invoiceRef.current) {
            alert("Error: Invoice reference not found.");
            return;
        }

        try {
            console.log("Starting PDF generation...");
            const element = invoiceRef.current;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: true, // Enable logging for debugging
                backgroundColor: "#ffffff",
                onclone: (clonedDoc) => {
                    // Fix for Tailwind CSS v4 oklch error
                    const elementsWithOklch = clonedDoc.querySelectorAll('*');
                    elementsWithOklch.forEach((el: any) => {
                        const style = window.getComputedStyle(el);
                        // html2canvas fails on oklch. We can't easily convert all, 
                        // but we can try to force standard colors or remove problematic ones
                        if (style.color?.includes('oklch') || style.backgroundColor?.includes('oklch') || style.borderColor?.includes('oklch')) {
                            // Reset to safe defaults if oklch is detected
                            if (style.color?.includes('oklch')) el.style.color = 'inherit';
                            if (style.backgroundColor?.includes('oklch')) el.style.backgroundColor = 'transparent';
                            if (style.borderColor?.includes('oklch')) el.style.borderColor = 'currentColor';
                        }

                        // Remove some modern CSS features that cause issues
                        el.style.containerType = 'none';
                        el.style.contentVisibility = 'visible';
                    });
                }
            });

            console.log("Canvas generated successfully.");

            const imgData = canvas.toDataURL("image/png");

            const pdf = new jsPDF({
                orientation: "p",
                unit: "mm",
                format: "a4"
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / (imgWidth / 2.8), pdfHeight / (imgHeight / 2.8)); // Adjust ratio for scale

            const finalWidth = (imgWidth / 2.8) * ratio;
            const finalHeight = (imgHeight / 2.8) * ratio;

            const x = (pdfWidth - finalWidth) / 2;
            const y = 10;

            pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight, undefined, 'FAST');
            pdf.save(`Invoice_${invoiceData.invoiceNumber}.pdf`);
            console.log("PDF saved successfully.");
        } catch (error: any) {
            console.error("PDF Generation Error:", error);
            alert(`Failed to generate PDF: ${error.message || error.toString()}. This is often caused by modern CSS features like Tailwind v4 oklch colors.`);
        }
    };

    return (
        <>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-[25px] gap-[15px]">
                <div>
                    <h2 className="text-xl font-bold text-black dark:text-white mb-1">
                        Invoice Details
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        View and download your invoice.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-gray-100 dark:bg-[#172036] text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-[#1a2847] transition-colors flex items-center gap-2"
                    >
                        <i className="material-symbols-outlined text-[20px]">arrow_back</i>
                        Back
                    </button>
                    <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <i className="material-symbols-outlined text-[20px]">download</i>
                        Download PDF
                    </button>
                </div>
            </div>

            {/* Invoice Card */}
            <div
                ref={invoiceRef}
                className="bg-white dark:bg-[#0c1427] rounded-xl border border-gray-100 dark:border-[#172036] p-8 md:p-12 max-w-4xl mx-auto"
            >
                {/* Invoice Header */}
                <div className="flex flex-col md:flex-row justify-between mb-8 pb-8 border-b border-gray-200 dark:border-[#172036]">
                    <div>
                        <h1 className="text-3xl font-bold text-black dark:text-white mb-2">INVOICE</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">
                            Invoice No: #{invoiceData.invoiceNumber}
                        </p>
                        <div className="flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1.5">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Order ID:</span>
                                {invoiceData.orderId}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Date:</span>
                                {invoiceData.date}
                            </span>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <span className="inline-block px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-semibold">
                            {invoiceData.status}
                        </span>
                    </div>
                </div>

                {/* Company & Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* From */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">From</h3>
                        <h4 className="text-lg font-bold text-black dark:text-white mb-2">{invoiceData.company.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {invoiceData.company.address}<br />
                            {invoiceData.company.email}<br />
                            {invoiceData.company.phone}<br />
                            GST: {invoiceData.company.gst}
                        </p>
                    </div>

                    {/* To */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Bill To</h3>
                        <h4 className="text-lg font-bold text-black dark:text-white mb-2">{invoiceData.customer.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {invoiceData.customer.address}<br />
                            {invoiceData.customer.email}<br />
                            {invoiceData.customer.phone}
                        </p>
                    </div>
                </div>



                {/* Items Table */}
                <div className="mb-8 overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="border-b-2 border-gray-200 dark:border-[#172036]">
                                <th className="text-left py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Description</th>
                                <th className="text-center py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Qty</th>
                                <th className="text-right py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Price</th>
                                <th className="text-right py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoiceData.items.map((item, index) => (
                                <tr key={index} className="border-b border-gray-100 dark:border-[#172036]">
                                    <td className="py-4 text-sm text-gray-800 dark:text-gray-200">{item.description}</td>
                                    <td className="py-4 text-sm text-gray-800 dark:text-gray-200 text-center">{item.quantity}</td>
                                    <td className="py-4 text-sm text-gray-800 dark:text-gray-200 text-right">₹{item.price.toFixed(2)}</td>
                                    <td className="py-4 text-sm font-semibold text-gray-900 dark:text-white text-right">₹{item.total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-full md:w-80">
                        <div className="flex justify-between py-2 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                            <span className="font-semibold text-gray-900 dark:text-white">₹{invoiceData.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Service Charge</span>
                            <span className="font-semibold text-gray-900 dark:text-white">₹{invoiceData.serviceCharge.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Tax (18% GST)</span>
                            <span className="font-semibold text-gray-900 dark:text-white">₹{invoiceData.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-3 border-t-2 border-gray-200 dark:border-[#172036] mt-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">₹{invoiceData.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-[#172036]">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        Thank you for your purchase! For any queries, please contact us at {invoiceData.company.email}
                    </p>
                </div>
            </div>
        </>
    );
};

export default Invoice;
