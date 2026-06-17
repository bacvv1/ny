import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// 1. Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.enabled = false; 

let isIntro = true;

// 2. Tạo hình trái tim
const count = 4000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(count * 3);
for(let i = 0; i < count; i++) {
    const t = Math.PI * 2 * Math.random();
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
    positions[i*3] = x * 0.08;
    positions[i*3+1] = y * 0.08;
    positions[i*3+2] = (Math.random() - 0.5) * 0.5;
}
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const material = new THREE.PointsMaterial({ 
    size: 0.03, color: 0xff0033, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending 
});
const heart = new THREE.Points(geometry, material);
scene.add(heart);

// 3. Nền sao
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(5000 * 3);
for(let i = 0; i < 5000 * 3; i++) starPos[i] = (Math.random() - 0.5) * 100;
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ size: 0.1, color: 0xffffff, transparent: true, opacity: 0.5 });
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

// 4. Audio Setup
const listener = new THREE.AudioListener();
camera.add(listener);
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

// Sử dụng BASE_URL để luôn tìm đúng file nhạc bất kể tên repo là gì
const songUrl = import.meta.env.BASE_URL + 'music/song.mp3';

audioLoader.load(songUrl, (buffer) => {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
}, undefined, (err) => {
    console.error("Lỗi khi load nhạc:", err);
});

const analyser = new THREE.AudioAnalyser(sound, 32);

const btnPlay = document.getElementById('btnPlay');
if(btnPlay) {
    btnPlay.addEventListener('click', async () => {
        document.getElementById('overlay').style.display = 'none';
        
        // Resume context để đảm bảo nhạc phát được trên mọi trình duyệt
        if (listener.context.state === 'suspended') {
            await listener.context.resume();
        }
        
        sound.play();

        gsap.to(camera.position, {
            z: 3,
            duration: 4,
            ease: "power2.inOut",
            onComplete: () => {
                isIntro = false;
                controls.enabled = true;
            }
        });
    });
}

// 5. Animation
function animate() {
    requestAnimationFrame(animate);
    
    if (sound.isPlaying) {
        const data = analyser.getAverageFrequency();
        const scale = 1 + (data / 255) * 0.8; 
        heart.scale.set(scale, scale, scale);
        material.opacity = 0.5 + (data / 255) * 0.5;
        
        const starPositions = stars.geometry.attributes.position.array;
        const intensity = (data / 255) * 0.05; 
        
        for (let i = 0; i < starPositions.length; i += 3) {
            starPositions[i] += (Math.random() - 0.5) * intensity;
            starPositions[i + 1] += (Math.random() - 0.5) * intensity;
            if (Math.abs(starPositions[i]) > 50) starPositions[i] *= -0.9;
        }
        stars.geometry.attributes.position.needsUpdate = true;
    }
    
    stars.rotation.y += 0.0002;
    
    if (!isIntro) controls.update();
    
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});