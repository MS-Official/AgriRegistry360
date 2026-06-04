from odoo import fields, models


class AgriRegistryFarmer(models.Model):
    _name = "agriregistry.farmer"
    _description = "AgriRegistry360 Farmer"
    _rec_name = "full_name"

    farmer_code = fields.Char(required=True, index=True)
    full_name = fields.Char(required=True)
    national_id = fields.Char(index=True)
    mobile_number = fields.Char()
    district = fields.Char()
    gn_division = fields.Char()
    farmer_type = fields.Char()
    verification_status = fields.Char()
    registered_by = fields.Char()
    external_mongo_id = fields.Char(index=True)


class AgriRegistryFarm(models.Model):
    _name = "agriregistry.farm"
    _description = "AgriRegistry360 Farm / Land"
    _rec_name = "farm_code"

    farm_code = fields.Char(required=True, index=True)
    farmer_code = fields.Char(index=True)
    farmer_name = fields.Char()
    district = fields.Char()
    gn_division = fields.Char()
    ownership_type = fields.Char()
    land_size = fields.Float()
    land_size_unit = fields.Char()
    verification_status = fields.Char()
    external_mongo_id = fields.Char(index=True)


class AgriRegistryCrop(models.Model):
    _name = "agriregistry.crop"
    _description = "AgriRegistry360 Crop"
    _rec_name = "crop_code"

    crop_code = fields.Char(required=True, index=True)
    farm_code = fields.Char(index=True)
    farmer_code = fields.Char(index=True)
    crop_type = fields.Char()
    season = fields.Char()
    season_year = fields.Integer()
    cultivation_area = fields.Float()
    cultivation_area_unit = fields.Char()
    expected_yield = fields.Float()
    verification_status = fields.Char()
    external_mongo_id = fields.Char(index=True)


class AgriRegistryEligibility(models.Model):
    _name = "agriregistry.eligibility"
    _description = "AgriRegistry360 Eligibility Check"
    _rec_name = "eligibility_code"

    eligibility_code = fields.Char(required=True, index=True)
    farmer_code = fields.Char(index=True)
    farm_code = fields.Char(index=True)
    crop_code = fields.Char(index=True)
    program_code = fields.Char()
    program_name = fields.Char()
    eligibility_status = fields.Char()
    recommended_entitlement = fields.Char()
    checked_by = fields.Char()
    external_mongo_id = fields.Char(index=True)


class AgriRegistryEnrollment(models.Model):
    _name = "agriregistry.enrollment"
    _description = "AgriRegistry360 Program Enrollment"
    _rec_name = "enrollment_code"

    enrollment_code = fields.Char(required=True, index=True)
    eligibility_code = fields.Char(index=True)
    farmer_code = fields.Char(index=True)
    program_code = fields.Char()
    program_name = fields.Char()
    entitlement = fields.Char()
    enrollment_status = fields.Char()
    approval_status = fields.Char()
    enrolled_by = fields.Char()
    external_mongo_id = fields.Char(index=True)


class AgriRegistryInventoryReservation(models.Model):
    _name = "agriregistry.inventory.reservation"
    _description = "AgriRegistry360 Inventory Reservation"
    _rec_name = "reservation_code"

    name = fields.Char()
    reservation_code = fields.Char(required=True, index=True)
    enrollment_code = fields.Char(index=True)
    farmer_code = fields.Char(index=True)
    farmer_name = fields.Char()
    farm_code = fields.Char(index=True)
    crop_code = fields.Char(index=True)
    program_name = fields.Char()
    entitlement = fields.Char()
    item_code = fields.Char(index=True)
    item_name = fields.Char()
    reserved_quantity = fields.Float()
    quantity_unit = fields.Char()
    warehouse_name = fields.Char()
    reservation_status = fields.Char()
    reserved_by = fields.Char()
    notes = fields.Text()
    reserved_at = fields.Datetime()
    issued_at = fields.Datetime()
    external_mongo_id = fields.Char(index=True)


class AgriRegistryInventoryItem(models.Model):
    _name = "agriregistry.inventory.item"
    _description = "AgriRegistry360 Inventory Item"
    _rec_name = "item_code"

    name = fields.Char()
    item_code = fields.Char(required=True, index=True)
    item_name = fields.Char(required=True)
    category = fields.Char()
    available_quantity = fields.Float()
    reserved_quantity = fields.Float()
    distributed_quantity = fields.Float()
    quantity_unit = fields.Char()
    warehouse_name = fields.Char()
    status = fields.Char()
    external_mongo_id = fields.Char(index=True)
