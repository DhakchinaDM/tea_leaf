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


class PurchaseOrderReport(models.AbstractModel):
    _name = "report.tea_leaf_purchase_order.purchase_order_report_template"
    _description = "Purchase Order Report"

    def _get_report_values(self, docids, data=None):
        reports = self.env["purchase.order.report"].browse(docids)
        return {
            "doc_ids": docids,
            "doc_model": "purchase.order.report",
            "docs": reports,
        }
