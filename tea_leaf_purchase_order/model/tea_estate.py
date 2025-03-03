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


class TeaLeafOrderLine(models.Model):
    _name = "tea.leaf.order.line"
    _description = 'Tea Leaf Order Line'

    tkn_no = fields.Integer("Tkn No")
    tare = fields.Integer("Tkn No")
    nett = fields.Integer("Tkn No")
    product = fields.Many2one('product.product',"Product")
    partner_id = fields.Many2one('res.partner',"partner")