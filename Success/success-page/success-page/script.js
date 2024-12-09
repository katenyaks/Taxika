document.addEventListener('DOMContentLoaded', () => {
    const loader = document.querySelector('.loader');
    const successContainer = document.querySelector('.success-container');

    // Simulate loading time (you can replace this with your actual loading logic)
    setTimeout(() => {
        // Hide loader with fade out effect
        loader.style.animation = 'fadeOut 0.5s ease-out forwards';

        // Show success container after loader fades out
        setTimeout(() => {
            loader.style.display = 'none';
            successContainer.style.display = 'flex';
        }, 500);
    }, 3000); // Change this value to adjust the loading time
});

// Add fadeOut animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

