// ATP creation skipped — reusing existing database reacttodonoq0x

//======= Name space details ------------------------------------------------------
data "oci_objectstorage_namespace" "test_namespace" {
  #Optional
  compartment_id = var.ociCompartmentOcid
}
//========= Outputs ===========================
output "ns_objectstorage_namespace" {
  value =  [ data.oci_objectstorage_namespace.test_namespace.namespace ]
}