const firebaseConfig = {
    apiKey: "AIzaSyDqci3Rbaqbrr-pgZ_4KH2il_tOOLTNFD8",
    authDomain: "falahi-store.firebaseapp.com",
    projectId: "falahi-store",
    storageBucket: "falahi-store.firebasestorage.app",
    messagingSenderId: "116571130243",
    appId: "1:116571130243:web:b1228ff5990940ce8d8eb6"
};

if (!window.firebase || !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
let cart = [];

function toggleCartModal() {
    const cartSection = document.getElementById('cart-section');
    if (cartSection) {
        cartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

async function loadProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    try {
        grid.innerHTML = "<p style='text-align:center; color:#555; padding:1.2rem 0;'>جاري تحميل المنتجات...</p>";
        const querySnapshot = await db.collection('falahi').get();

        const products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });

        if (products.length === 0) {
            grid.innerHTML = "<p style='text-align:center; color:#b77a00; padding:1.2rem 0;'>لا توجد منتجات مضافة في قاعدة البيانات حالياً.</p>";
            return;
        }

        renderProducts(products);
    } catch (error) {
        console.error('خطأ في جلب المنتجات:', error);
        grid.innerHTML = `<p style='text-align:center; color:#b62a2a; padding:1.2rem 0;'>خطأ في الاتصال بقاعدة البيانات: ${error.message}</p>`;
    }
}

function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    grid.innerHTML = '';

    products.forEach((product) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image || 'https://via.placeholder.com/300x200?text=منتج'}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=منتج'">
            <div class="product-info">
                <h3>${product.name}</h3>
                ${product.description ? `<p class="product-desc">${product.description}</p>` : ''}
                <div class="product-bottom">
                    <span class="price">${product.price} ج.م</span>
                    <button class="add-to-cart-btn" type="button" onclick="addToCart('${product.id}', '${product.name}', ${Number(product.price) || 0})">
                        🛒 إضافة للسلة
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function addToCart(id, name, price) {
    const existingItem = cart.find((item) => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    updateCartUI();
}

function removeFromCart(id) {
    cart = cart.filter((item) => item.id !== id);
    updateCartUI();
}

function updateQuantity(id, change) {
    const item = cart.find((product) => product.id === id);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        removeFromCart(id);
        return;
    }

    updateCartUI();
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');

    if (cartCount) {
        const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalCount;
    }

    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">السلة فارغة حالياً...</p>';
        if (cartTotalElement) cartTotalElement.textContent = '0';
        return;
    }

    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div>
                <strong>${item.name}</strong><br>
                <small>${item.price} ج.م × ${item.quantity}</small>
            </div>
            <div class="qty-controls">
                <button type="button" onclick="updateQuantity('${item.id}', -1)">-</button>
                <span>${item.quantity}</span>
                <button type="button" onclick="updateQuantity('${item.id}', 1)">+</button>
                <button type="button" class="remove-item" onclick="removeFromCart('${item.id}')">❌</button>
            </div>
        `;
        cartItemsContainer.appendChild(div);
    });

    if (cartTotalElement) {
        cartTotalElement.textContent = total;
    }
}

function sendOrderToWhatsApp() {
    if (cart.length === 0) {
        alert('السلة فارغة! اضف بعض المنتجات أولاً.');
        return;
    }

    const customerNameInput = document.getElementById('customer-name');
    const customerPhoneInput = document.getElementById('customer-phone');
    const deliveryAddressInput = document.getElementById('delivery-address');
    const specialNotesInput = document.getElementById('special-notes');
    const paymentMethodInput = document.querySelector('input[name="payment-method"]:checked');

    const customerName = customerNameInput ? customerNameInput.value.trim() : '';
    const customerPhone = customerPhoneInput ? customerPhoneInput.value.trim() : '';
    const deliveryAddress = deliveryAddressInput ? deliveryAddressInput.value.trim() : '';
    const specialNotes = specialNotesInput ? specialNotesInput.value.trim() : '';
    const paymentMethod = paymentMethodInput ? paymentMethodInput.value : 'كاش عند الاستلام';

    if (!customerName) {
        alert('يرجى كتابة اسم العميل قبل إرسال الطلب.');
        return;
    }

    if (!customerPhone) {
        alert('يرجى كتابة رقم الهاتف قبل إرسال الطلب.');
        return;
    }

    if (!deliveryAddress) {
        alert('يرجى كتابة عنوان التوصيل قبل إرسال الطلب.');
        return;
    }

    let message = '🛒 *طلب جديد من المتجر:* \n\n';
    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        message += `${index + 1}. *${item.name}* \n   - الكمية: ${item.quantity} \n   - السعر: ${itemTotal} ج.م\n`;
    });

    message += `\n💰 *الإجمالي:* ${total} ج.م\n`;
    message += `\n👤 *اسم العميل:* ${customerName}\n`;
    message += `📞 *رقم الهاتف:* ${customerPhone}\n`;
    message += `📍 *عنوان التوصيل:*\n${deliveryAddress}\n`;
    message += `💳 *طريقة الدفع:* ${paymentMethod}\n`;

    if (specialNotes) {
        message += `\n📝 *ملاحظات / طلب خاص:* \n${specialNotes}\n`;
    }

    message += '\nيرجى تأكيد الطلب وتحديد موعد التوصيل. شكراً لك!';

    const phoneNumber = '201004398541';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

document.addEventListener('DOMContentLoaded', loadProducts);