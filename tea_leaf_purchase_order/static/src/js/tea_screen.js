/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, useState, onMounted, xml } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

class OwlOdooServices extends Component {
    static template = "tea_leaf_purchase_order.OdooServices";

    setup() {
        this.orm = useService("orm"); // ORM Service for database queries
        this.notification = useService("notification"); // Odoo Notification Service
        this.state = useState({
            partners: [],  // Store fetched partners
            selectedPartner: null, // Store selected partner ID
            nextId: 1, // Unique ID tracker
            tkn_id: 1, // Unique ID tracker
            orderLines: [], // Store order lines dynamically
            products: [], // Store fetched products
            status: false, // Store fetched products

        });
        this.updateNett = this.updateNett.bind(this);

        onMounted(() => {
            this.loadPartners();
            this.loadProducts();

        });
    }


    async loadPartners() {
        try {
            const partners = await this.orm.searchRead("res.partner", [], ["id", "name"]);
            this.state.partners = partners;
            console.log("Partners loaded:", partners);
        } catch (error) {
            console.error("Error loading partners:", error);
        }
    }
    async loadProducts() {
        try {
            const products = await this.orm.searchRead("product.product", [], ["id", "name"]);
            this.state.products = products;
            console.log("Products loaded:", products);
        } catch (error) {
            console.error("Error loading products:", error);
        }
    }

    onPartnerChange(event) {
        this.state.selectedPartner = event?.target?.value || null;
        console.log("Selected Partner ID:", this.state.selectedPartner);
    }

     addrow() {
        if (!this.state.selectedPartner) {
            this.notification.add("Please select a partner!", { type: "warning" });
            return;
        }
        const newId = this.state.nextId++; // Generate a unique ID
        const productList = this.state.products;
        const randomProduct = productList.length > 0
            ? productList[newId % productList.length] // Pick a random product
            : { id: null, name: "Default Product" };

        const newRow = {
            id: newId,
            tkn_no_id: `tkn_no_${newId}`,
            product_id: randomProduct.id,
            quantity_id: `quantity_${newId}`,
            tare_id: `tare_${newId}`,
            nett_id: `nett_${newId}`,
            tkn_no: this.state.tkn_id++,
            product: randomProduct.name,
            quantity: 0,
            tare: 0,
            nett: 0,
        };

        // ✅ Update the entire array to trigger a reactivity update
        this.state.orderLines = [...this.state.orderLines, newRow];
    }


    updateNett(lineId) {
        const lineIndex = this.state.orderLines.findIndex((line) => line.id === lineId);
        console.log("############################333",lineId, this.state.orderLines);
        if (lineIndex !== -1) {
            const quantity = parseFloat(document.getElementById(this.state.orderLines[lineIndex].quantity_id)?.value || 0);
            const tare = parseFloat(document.getElementById(this.state.orderLines[lineIndex].tare_id)?.value || 0);

            console.log('JJJJJJJJJJJJJ++++++++++++++', quantity, tare, quantity - tare)
            this.state.orderLines[lineIndex].nett = Math.max(0, quantity - tare); // Ensure non-negative value
        }
    }



    async getValues() {
        let orderLines = [];

        this.state.orderLines.forEach((line) => {
            const tkn_no = document.getElementById(line.tkn_no_id)?.value || "";
            const product_id = parseInt(line.product_id) || null;
            const quantity = parseFloat(document.getElementById(line.quantity_id)?.value || 0);
            const tare = parseFloat(document.getElementById(line.tare_id)?.value || 0);
            const nett = parseFloat(document.getElementById(line.nett_id)?.value || 0);

            if (product_id && quantity > 0) {
                orderLines.push([0, 0, {
                    tkn_no,
                    product_id,
                    quantity,
                    tare,
                    nett
                }]); // ✅ Correct Format for One2many
            }
        });

        console.log("//////////////////////////////////", orderLines);

        if (orderLines.length === 0) {
            this.notification.add("No valid order lines to generate the report!", { type: "warning" });
            return;
        }

        try {
            // Store order lines in the database with correct format
            const reportId = await this.orm.create("purchase.order.report", [{
                name: this.state.selectedPartner, // ✅ Fixed Format
                order_lines: orderLines // ✅ Fixed Format
            }]);

            this.notification.add("Report generated successfully!", { type: "success" });
            // Redirect to PDF report
            this.downloadReport(reportId);
            this.reloadPage();
        } catch (error) {
            console.error("Error generating report:", error);
            this.notification.add("Error generating report!", { type: "danger" });
        }
    }


    // Function to Download the Report
    downloadReport(reportId) {
        window.open(`/report/pdf/tea_leaf_purchase_order.purchase_order_report/${reportId}`, "_blank");
    }



    reloadPage() {
        location.reload();
    }

    async createPurchaseOrder() {
        if (!this.state.selectedPartner) {
            this.notification.add("Please select a partner!", { type: "warning" });
            return;
        }

        if (this.state.orderLines.length === 0) {
            this.notification.add("Please add at least one order line!", { type: "warning" });
            return;
        }

        try {
            // ✅ Group products to sum up duplicate quantities
            const productMap = new Map();

            this.state.orderLines.forEach(line => {
                const productId = parseInt(line.product_id);
                const productQty = parseFloat(document.getElementById(line.nett_id)?.value || 0);

                // ✅ Ensure valid product and quantity
                if (!productId || productQty <= 0) {
                    console.warn(`Skipping invalid order line: Product ID = ${line.product_id}, Qty = ${productQty}`);
                    return;
                }

                // ✅ Merge duplicate products by summing quantities
                if (productMap.has(productId)) {
                    productMap.set(productId, productMap.get(productId) + productQty);
                } else {
                    productMap.set(productId, productQty);
                }
            });

            // ✅ Convert grouped products into Odoo order_line format
            const orderLines = Array.from(productMap.entries()).map(([product_id, product_qty]) => [
                0, 0, { product_id, product_qty }
            ]);
            console.log("Final Order Lines:", orderLines); // Debugging

            // ✅ Ensure orderLines is not empty before creating order
            if (orderLines.length === 0) {
                this.notification.add("No valid order lines found!", { type: "warning" });
                return;
            }

            // ✅ Create Purchase Order
            const purchaseOrderId = await this.orm.create("purchase.order", [{
                partner_id: this.state.selectedPartner,
                order_line: orderLines
            }]);
            await this.orm.call("purchase.order", "button_confirm", [
            purchaseOrderId,
            ]);
            await this.orm.call("purchase.order", "validate_receive_products", [
            purchaseOrderId,
            ]);

            this.notification.add(`Purchase Order ${purchaseOrderId} Created Successfully!`, { type: "success" });
            console.log("Created Purchase Order ID:", purchaseOrderId);

            // ✅ Clear order lines after successful creation
//            this.state.orderLines = [];
            this.state.status = true;

        } catch (error) {
            console.error("Error creating purchase order:", error);
            this.notification.add("Error creating Purchase Order!", { type: "danger" });
        }
    }


}

// Register the component
registry.category("actions").add("tea_leaf_purchase_order.OdooServices", OwlOdooServices);
