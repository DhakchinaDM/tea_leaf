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

        });

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


    getValues() {
        this.state.orderLines.forEach((line) => {
            const tkn_no = document.getElementById(line.tkn_no_id)?.value || "";
            const product = document.getElementById(line.product_id)?.value || "";
            const quantity = document.getElementById(line.quantity_id)?.value || 0;
            const tare = document.getElementById(line.tare_id)?.value || 0;
            const nett = document.getElementById(line.nett_id)?.value || 0;

            console.log(`Row ID: ${line.id}`);
            console.log(`TKN No: ${tkn_no}`);
            console.log(`Product: ${product}`);
            console.log(`quantity: ${quantity}`);
            console.log(`Tare: ${tare}`);
            console.log(`Nett: ${nett}`);
        });
    }
    updateNett(lineId) {
        const lineIndex = this.state.orderLines.findIndex((line) => line.id === lineId);
        console.log("lllllllllllllllllllllllllllllllllllllllllllllllll",lineIndex)
        if (lineIndex !== -1) {
            const quantity = parseFloat(document.getElementById(this.state.orderLines[lineIndex].quantity_id)?.value || 0);
            const tare = parseFloat(document.getElementById(this.state.orderLines[lineIndex].tare_id)?.value || 0);
            this.state.orderLines[lineIndex].nett = Math.max(0, quantity - tare); // Ensure non-negative value
        }
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

            this.notification.add(`Purchase Order ${purchaseOrderId} Created Successfully!`, { type: "success" });
            console.log("Created Purchase Order ID:", purchaseOrderId);

            // ✅ Clear order lines after successful creation
//            this.state.orderLines = [];

        } catch (error) {
            console.error("Error creating purchase order:", error);
            this.notification.add("Error creating Purchase Order!", { type: "danger" });
        }
    }


}

// Register the component
registry.category("actions").add("tea_leaf_purchase_order.OdooServices", OwlOdooServices);
