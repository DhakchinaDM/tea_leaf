from odoo import models, fields, api, _
from datetime import datetime, timedelta, date
from datetime import date, datetime
import xlwt
from io import BytesIO
import base64
from base64 import b64decode, b64encode
from xlwt import easyxf, Borders
import io
import base64
from odoo.tools import base64_to_image
from PIL import Image
from odoo.exceptions import AccessError, UserError, ValidationError


# class TeaLeafOrderLine(models.Model):
#     _name = "tea.leaf.order.line"
#     _description = 'Tea Leaf Order Line'
#
#     tkn_no = fields.Integer("Tkn No")
#     tare = fields.Integer("Tkn No")
#     nett = fields.Integer("Tkn No")
#     product = fields.Many2one('product.product',"Product")
#     partner_id = fields.Many2one('res.partner',"partner")




class PurchaseOrderReport(models.Model):
    _name = "purchase.order.report"
    _description = "Purchase Order Report"

    name= fields.Many2one('res.partner',"Partner")

    order_lines = fields.One2many("purchase.order.report.line", "report_id", string="Order Lines")

class PurchaseOrderReportLine(models.Model):
    _name = "purchase.order.report.line"
    _description = "Purchase Order Report Line"

    report_id = fields.Many2one("purchase.order.report", string="Report")
    tkn_no = fields.Char(string="TKN No")
    product_id = fields.Many2one("product.product", string="Product")
    quantity = fields.Float(string="Quantity")
    tare = fields.Float(string="Tare")
    nett = fields.Float(string="Nett")




class PurchaseOrder(models.Model):
    _inherit = "purchase.order"

    def validate_receive_products(self):
        for i in self:
            for j in i.picking_ids:
                print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$",j)
                j.button_validate()