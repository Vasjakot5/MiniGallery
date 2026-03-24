function loadFooter() {
    const footerHTML = `
        <footer>
            <div class="container">
                <div class="footer-content">
                    <p>&copy; 2026 Mini Gallery. Все права защищены.</p>
                </div>
            </div>
        </footer>
    `;
    document.body.insertAdjacentHTML('beforeend', footerHTML);
}
document.addEventListener('DOMContentLoaded', loadFooter);