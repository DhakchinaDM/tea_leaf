{
    'name': 'Tea Estate Screen',
    'version': '17.0.1.0.2',
    'sequence': 1,
    'license': 'LGPL-3',
    'depends': ["base", "web","purchase"],
    'module_type': '',
    'data': [
        'security/ir.model.access.csv',
        'views/report.xml',
        'views/xml_view.xml',
        'views/order_line.xml',
    ],
    'assets': {
        'web.assets_backend': [
            # 'overall_reports/static/css/reserve_summary_button.css',
            'tea_leaf_purchase_order/static/src/js/tea_screen.js',
            'tea_leaf_purchase_order/static/src/xml/tea_service.xml',
            # 'overall_reports/static/src/css/services.css',
        ],
    },
    'application': True,
}

