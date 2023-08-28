import { View, Text, SafeAreaView, StyleSheet,TextInput,TouchableOpacity, ScrollView, Modal } from 'react-native';
import colors from '../config/colors';
import { useState,useEffect } from 'react';
import {getLastInvoiceNumber} from '../config/supabaseClient';
import { getProducts, saveInvoiceToDb } from '../config/supabaseClient';
import { Dropdown } from 'react-native-element-dropdown';
import ErrorModal from '../components/errorModal';


  function getCurrentDate() {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  
  function NewBill({navigation}) {

    const [productList, setProductList] = useState([]);
    
      
      

    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [date, setDate] = useState(getCurrentDate());
    const [customerName, setCustomerName] = useState('');
    const [billingAddress, setBillingAddress] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');
    const [customerGst, setCustomerGst] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [products, setProducts] = useState([{ serial: '1', name: '', hsn: '', gst: '', quantity: '', unit: '',gst_rate: '', rate: '', disc: '0', amount: '',product_id: '',item_total:'' }]);
    const [total, setTotal] = useState('0');
    const [cgst, setCgst] = useState('0');
    const [sgst, setSgst] = useState('0');
    const [igst, setIgst] = useState('0');
    const [grandTotal, setGrandTotal] = useState('0');

    const [showErrorModal, setShowErrorModal] = useState(false);
    
    const handleViewBill = (billId) => {
      navigation.replace('ViewOldBills');
      navigation.navigate('ViewBill', { billId: billId });
    };

    useEffect(() => {
      fetchInvoiceNumber();
      fetchList();

    }, []);
  
    async function fetchInvoiceNumber() {
      const number = await getLastInvoiceNumber();
      const nextInvoiceNumber = number + 1;
      setInvoiceNumber(nextInvoiceNumber.toString());
    }
    async function fetchList() {
        const billsData = await getProducts();
        if (billsData) {
            setProductList(billsData);
        }
      }
  
    async function handleInvoiceNumberChange(text) {
      setInvoiceNumber(text);
    }
  
    async function handleDateChange(text) {
      setDate(text);
    }

    async function handleCustomerNameChange(text) {
        setCustomerName(text);
    }

    async function handleBillingAddressChange(text) {
        setBillingAddress(text);
    };
    
    async function handleShippingAddressChange(text) {
        setShippingAddress(text);
    };

    const copyBillingAddress = () => {
        setShippingAddress(billingAddress);
    };

    const handleCustomerGstChange = (text) => {
        setCustomerGst(text);
    };

    const handleCustomerPhoneChange = (text) => {
        setCustomerPhone(text);
    };
    async function rateChange(index) {
        const updatedProducts = [...products];
        const rate = parseFloat(updatedProducts[index].rate);
        const gst = parseFloat(updatedProducts[index].gst);
        const quantity = parseFloat(updatedProducts[index].quantity);
        const disc = parseFloat(updatedProducts[index].disc);
        const total = (rate * quantity).toFixed(2);
        const discAmount = ((total * disc) / 100).toFixed(2);
        updatedProducts[index].amount = (total - discAmount).toFixed(2).toString();
        updatedProducts[index].item_total = parseFloat(updatedProducts[index].amount) + parseFloat(updatedProducts[index].amount)*(gst/100);
        setProducts(updatedProducts);
    }
    const handleProductFieldChange = (index, field, value) => {
        const updatedProducts = [...products];
        updatedProducts[index][field] = value;
        if (field === "gst_rate") {
          const gstRate = parseFloat(value);
          const gst = parseFloat(updatedProducts[index].gst)
          updatedProducts[index].rate = (gstRate*100/(100+gst)).toFixed(2).toString();
          
        }
        setProducts(updatedProducts);
        if (field === "quantity" || field === "disc" || field === 'gst_rate') {
            rateChange(index);
        }

      };
    
    const addProduct = () => {
        const newSerial = (products.length + 1).toString();
        const newProduct = { serial: newSerial, name: '', hsn: '', gst: '', quantity: '', unit: '',gst_rate: '', rate: '', disc: '0', amount: '' , product_id: '', item_total:''};
        setProducts(prevProducts => [...prevProducts, newProduct]);
    };

    const removeProduct = (index) => {
        const updatedProducts = [...products];
        updatedProducts.splice(index, 1);
        setProducts(updatedProducts);
    };

    const handleProductNameChange = (index, value) => {
        const selectedProduct = productList.find(product => product.product_name === value.product_name);
        if (selectedProduct) {
    
          const updatedProducts = [...products];
          updatedProducts[index].name = selectedProduct.product_name;
          updatedProducts[index].rate = selectedProduct.unitprice.toString();
          updatedProducts[index].hsn = selectedProduct.hsn_sac.toString();
          updatedProducts[index].gst = selectedProduct.gst_rate.toString();
          updatedProducts[index].unit = selectedProduct.unit;
          updatedProducts[index].product_id = selectedProduct.id;

          const gstRate = parseFloat(selectedProduct.gst_rate);
          const unitPrice = parseFloat(selectedProduct.unitprice);

          updatedProducts[index].gst_rate = (unitPrice+  unitPrice*(gstRate/(100))).toString(); 

          setProducts(updatedProducts);
        }
      };


    useEffect(() => {
        calculateTotal();
    }, [products]);

    async function calculateTotal(){
        let total = 0;
        let cgst = 0;
        let sgst = 0;
        products.forEach(product => {
            total += parseFloat(product.amount);
            cgst += parseFloat(product.amount) * parseFloat(product.gst) / 200;
            sgst += parseFloat(product.amount) * parseFloat(product.gst) / 200;
        });
        const grand_total = total + cgst + sgst;
        setCgst(cgst.toFixed(2));
        setSgst(sgst.toFixed(2));
        setTotal(total.toFixed(2));
        setGrandTotal(grand_total.toFixed(2));

    };

    async function saveInvoice(){
        let isValid = true;

        if (customerName.trim() === '' ||
            billingAddress.trim() === '' ||
            shippingAddress.trim() === '' ||
            customerGst.trim() === '' ||
            customerPhone.trim() === '' ||
            products.length === 0) {
            isValid = false;
        }


        if (isValid) {
            const invoice = {
                invoice_number: invoiceNumber,
                date: date,
                customer_name: customerName,
                billing_address: billingAddress,
                shipping_address: shippingAddress,
                customer_gst: customerGst,
                customer_phone: customerPhone,
                total: total,
                cgst: cgst,
                sgst: sgst,
                igst: igst,
                grand_total: grandTotal,
                products: products
            };
            const resp = await saveInvoiceToDb(invoice);

            if (resp.status == "sucess") {
              handleViewBill(resp.bill_id);
            }
            else {
              setShowErrorModal(true);
            }

        } else {
        setShowErrorModal(true);
        }
        
    };
    
    const [namevalue, setValue] = useState(null);
    return (
      <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>

            <View style={styles.twoItemBox}>
                <View style={styles.inputBox}>
                    <Text style={styles.label}>Invoice Number</Text>
                    <TextInput
                    style={styles.input}
                    value={invoiceNumber}
                    keyboardType="numeric"
                    onChangeText={handleInvoiceNumberChange}
                    />
                </View>
                <View style={styles.inputBox}>
                    <Text style={styles.label}>Date</Text>
                    <TextInput
                    style={styles.input}
                    value={date}
                    onChangeText={handleDateChange}
                    />
                </View>
            </View>

            <View style = {styles.row}>
                <Text style={styles.label}>Customer Name</Text>
                <TextInput
                style={styles.input}
                value={customerName}
                placeholder='Enter Customer Name'
                onChangeText={handleCustomerNameChange}
                />
            </View>

            <View style = {styles.row}>
                <Text style={styles.label}>Billing Address</Text>
                <TextInput
                style={styles.biginput}
                value={billingAddress}
                placeholder='Enter Billing Address'
                multiline={true}
                onChangeText={handleBillingAddressChange}
                />
            </View>

            <View style = {styles.row}>
                <Text style={styles.label}>Shipping Address</Text>
                <TouchableOpacity style={styles.button} onPress={copyBillingAddress}>
                    <Text style={styles.buttonText}>Copy Billing Address</Text>
                </TouchableOpacity>
                <TextInput
                style={styles.biginput}
                value={shippingAddress}
                placeholder='Enter Shipping Address'
                multiline={true}
                onChangeText={handleShippingAddressChange}
                />
            </View>

            <View style = {styles.row}>
                <Text style={styles.label}>GSTIN</Text>
                <TextInput
                style={styles.input}
                value={customerGst}
                placeholder='Enter GSTIN'
                onChangeText={handleCustomerGstChange}
                />
            </View>

            <View style = {styles.row}>
                <Text style={styles.label}>Customer Phone</Text>
                <TextInput
                style={styles.input}
                value={customerPhone}
                placeholder='Enter Customer Phone'
                inputMode='numeric'
                onChangeText={handleCustomerPhoneChange}
                />
            </View>
            <View style={styles.line} />
            <Text style={styles.heading}>Products</Text>
            <View style={styles.line} />


            {products.map((product, index) => (
            <View key={index} style={styles.productItem}>
                <View style={styles.productField}>
                    <Text style={styles.productLabel}>Serial Number</Text>
                    <TextInput
                        style={styles.productInput}
                        value={product.serial}
                        onChangeText={(value) => handleProductFieldChange(index, 'serial', value)}
                    />
                </View>
                <View style={styles.productField}>
                    <Text style={styles.productLabel}>Name</Text>
                    <Dropdown
                        style={styles.dropdown}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        inputSearchStyle={styles.inputSearchStyle}
                        iconStyle={styles.iconStyle}
                        data={productList}
                        search
                        maxHeight={300}
                        labelField="product_name"
                        valueField="product_name"
                        placeholder="Select item"
                        searchPlaceholder="Search..."
                        value={namevalue}
                        onChange={(value) => handleProductNameChange(index, value)}
                       
                    />
                </View>
                {/* Add more product fields here */}

                <View style={styles.productField}>
                    <Text style={styles.productLabel}>HSN/SAC</Text>
                    <TextInput
                        style={styles.productInput}
                        value={product.hsn}
                        onChangeText={(value) => handleProductFieldChange(index, 'hsn', value)}
                    />
                </View>

                <View style={styles.productField}>
                    <Text style={styles.productLabel}>GST</Text>
                    <TextInput
                        style={styles.productInput}
                        value={product.gst}
                        inputMode='numeric'
                        onChangeText={(value) => handleProductFieldChange(index, 'gst', value)}
                    />
                </View>

                <View style={styles.productField}>
                    <Text style={styles.productLabel}>Unit</Text>
                    <TextInput
                        style={styles.productInput}
                        value={product.unit}
                        editable={false}
                        onChangeText={(value) => handleProductFieldChange(index, 'unit', value)}
                    />
                </View>
                <View style={styles.productField}>
                    <Text style={styles.productLabel}>Gst Rate</Text>
                    <TextInput
                        style={styles.productInput}
                        value={product.gst_rate}
                        inputMode='numeric'
                        onChangeText={(value) => handleProductFieldChange(index, 'gst_rate', value)}
                    />
                </View>
                <View style={styles.productField}>
                    <Text style={styles.productLabel}>Rate</Text>
                    <TextInput
                        style={styles.productInput}
                        value={product.rate}
                        editable={false}
                        onChangeText={(value) => handleProductFieldChange(index, 'rate', value)}
                    />
                </View>
                
                <View style={styles.productField}>
                    <Text style={styles.productLabel}>Quantity</Text>
                    <TextInput
                        style={styles.productInput}
                        value={product.quantity}
                        inputMode='numeric'
                        onChangeText={(value) => handleProductFieldChange(index, 'quantity', value)}
                    />
                </View>

                <View style={styles.productField}>
                    <Text style={styles.productLabel}>Discount</Text>
                    <TextInput
                        style={styles.productInput}
                        value={product.disc}
                        inputMode='numeric'
                        onChangeText={(value) => handleProductFieldChange(index, 'disc', value)}
                    />
                </View>

                <View style={styles.productField}>
                    <Text style={styles.productLabel}>Amount</Text>
                    <TextInput
                        style={styles.productInput}
                        value={product.amount}
                        editable={false}
                        onChangeText={(value) => handleProductFieldChange(index, 'amount', value)}
                    />
                </View>



                <TouchableOpacity style={styles.removeProductButton} onPress={() => removeProduct(index)}>
                <Text style={styles.removeProductButtonText}>Remove</Text>
                </TouchableOpacity>
            </View>
            ))}
            <View style={styles.buttonRow} >
                <TouchableOpacity style={styles.addProductButton} onPress={addProduct}>
                    <Text style={styles.addProductButtonText}>Add Product</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.line} />

            <View style = {styles.row}>
                <Text style={styles.label}>Total</Text>
                <TextInput
                style={styles.displayBox}
                editable={false}
                value={total}
                />
            </View>
            
            <View style={styles.twoItemBox}>
                <View style={styles.inputBox}>
                    <Text style={styles.label}>CGST</Text>
                    <TextInput
                    style={styles.displayBox}
                    value={sgst}
                    editable={false}
                    />
                </View>
                <View style={styles.inputBox}>
                    <Text style={styles.label}>SGST</Text>
                    <TextInput
                    style={styles.displayBox}
                    value={sgst}
                    editable={false}
                    />
                </View>
            
            </View>

            <View style = {styles.row}>
                    <Text style={styles.label}> Grand Total</Text>
                    <TextInput
                    style={styles.displayBox}
                    editable={false}
                    value={grandTotal}
                    placeholder='Enter Customer Name'
                    onChangeText={setTotal}
                    />
            </View>

            <ErrorModal visible={showErrorModal} 
                      message={"Please fill in all required fields"}
                      onClose={() => setShowErrorModal(false)} 
          />
            <TouchableOpacity style={styles.saveButton} onPress={saveInvoice}>
                <Text style={styles.addProductButtonText}>Generate Bill</Text>
            </TouchableOpacity>
       </ScrollView>    
      </SafeAreaView>
    );
  }
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary,
        padding: 30,
        backgroundColor: '#c5edeb',
        
    },
    twoItemBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,

    },
    inputBox: {
        marginBottom: 0,
    },
    displayBox: {
        height: 40,
        width: "100%",
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        paddingHorizontal: 15,
        marginBottom: 0,
        fontWeight: 'bold',
        color: 'black',
    
    },
    heading: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
        alignSelf: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
      },
      input: {
        height: 40,
        width: "100%",
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        paddingHorizontal: 15,
      },

      biginput: {
        height: 100,
        width: "100%",
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        paddingHorizontal: 15,
        paddingTop: 15,
        textAlignVertical: 'top',
      },
    row: {
        flexDirection: 'column',
        marginBottom: 20,
    },
    button: {
        backgroundColor: colors.secondary,
        width: '40%',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        marginBottom: 10,
      },
    buttonText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    scrollContentContainer: {
        flexGrow: 1,
        
    },
    line: {
        height: 1,
        backgroundColor: 'black',
        marginVertical: 10,
      },
      productItem: {
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
      },
      productField: {
        flexDirection: 'row',
        alignItems:'center',
        marginBottom: 5,
      },
      productLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 10,
      },
      productInput: {
        flex: 2,
        height: 40,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        paddingHorizontal: 15,
      },
      removeProductButton: {
        marginTop: 5,
        alignSelf: 'flex-end',
      },
      removeProductButtonText: {
        color: 'red',
        fontSize: 14,
        fontWeight: 'bold',
      },
      addProductButton: {
        backgroundColor: colors.secondary,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 5,
        marginBottom: 10,
        width: '80%',
        alignSelf: 'center',
        marginHorizontal: 30,
      },
      addProductButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
      },
      dropdown: {
        margin: 16,
        width: 180,
        height: 50,
        borderBottomColor: 'gray',
        borderBottomWidth: 0.5,
      },
      placeholderStyle: {
        fontSize: 16,
      },
      selectedTextStyle: {
        fontSize: 16,
      },
      inputSearchStyle: {
        height: 40,
        fontSize: 16,
      },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    saveButton: {
        backgroundColor: colors.secondary,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    error: {
        color: 'red',
        marginBottom: 8,
      },

});
export default NewBill;