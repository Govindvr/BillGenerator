// @ts-nocheck

const testServer =async () => {
    const uri = "https://gst-bill-backend.onrender.com/api/sheets/testServer";
    try {
        const response = await fetch(uri, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
        // console.log(response);
    }
    catch (error) {
        console.error('Error sending request:', error);
    }
}

export default testServer