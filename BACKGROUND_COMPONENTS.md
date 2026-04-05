# 🎨 Background Components Documentation

Dokumentasi lengkap untuk semua komponen background gradasi dengan gelombang minimalis.

## 1. **WaveBackground** - Gelombang Minimalis Sederhana

Komponen untuk background dengan gelombang minimalis yang elegan.

### Import
```tsx
import { WaveBackground } from '@/components/ui/WaveBackground';
```

### Usage
```tsx
<div className="min-h-screen relative overflow-hidden">
  <WaveBackground className="pointer-events-none" />
  <div className="relative z-10">
    {/* Your content here */}
  </div>
</div>
```

### Props
- `className?: string` - Custom CSS classes

---

## 2. **GradientBackground** - Background dengan Variasi

Komponen fleksibel dengan berbagai varian background.

### Import
```tsx
import { GradientBackground } from '@/components/ui/GradientBackground';
```

### Variants

#### Wave
```tsx
<GradientBackground variant="wave" />
```
Gelombang halus di atas.

#### Blob
```tsx
<GradientBackground variant="blob" />
```
Lingkaran-lingkaran dengan blur effect (glassmorphism).

#### Minimal
```tsx
<GradientBackground variant="minimal" />
```
Garis-garis aksen minimalis.

#### Gradient (Default)
```tsx
<GradientBackground variant="gradient" />
```
Kombinasi gradient dan gelombang.

### Props
- `variant?: 'wave' | 'gradient' | 'blob' | 'minimal'` - Pilih varian
- `className?: string` - Custom CSS classes

---

## 3. **BackgroundShapes** - Komponen Shape Individual

Komponen-komponen shape yang bisa dikombinasikan secara custom.

### Import
```tsx
import { 
  TopWaveShape, 
  BottomWaveShape, 
  DiagonalGradient, 
  CircleBlob,
  LineAccent 
} from '@/components/ui/BackgroundShapes';
```

### Usage Examples

#### Top Wave
```tsx
<TopWaveShape className="text-emerald-50 opacity-50" />
```

#### Bottom Wave
```tsx
<BottomWaveShape className="text-emerald-50 opacity-30" />
```

#### Circle Blob
```tsx
<CircleBlob 
  size="lg"           // 'sm' | 'md' | 'lg'
  position="top-right" // 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right'
  className="opacity-20"
/>
```

#### Diagonal Gradient
```tsx
<DiagonalGradient className="opacity-40" />
```

#### Line Accent
```tsx
<LineAccent 
  orientation="horizontal" // 'horizontal' | 'vertical'
  position="top-0"
/>
```

---

## 4. **ModernBackground** - Komponen Comprehensive

Menggabungkan semua shape menjadi satu background yang powerful dan fully customizable.

### Import
```tsx
import { ModernBackground } from '@/components/ui/ModernBackground';
```

### Usage
```tsx
<div className="min-h-screen relative overflow-hidden">
  <ModernBackground 
    theme="emerald"
    showWaves={true}
    showBlobs={true}
    showGradient={true}
    intensity="medium"
  />
  <div className="relative z-10">
    {/* Your content here */}
  </div>
</div>
```

### Props
- `theme?: 'emerald' | 'blue' | 'purple' | 'gradient'` - Pilih color theme
- `showWaves?: boolean` - Tampilkan gelombang (default: true)
- `showBlobs?: boolean` - Tampilkan blob shapes (default: true)
- `showGradient?: boolean` - Tampilkan gradient overlay (default: true)
- `intensity?: 'light' | 'medium' | 'heavy'` - Intensitas opacity (default: 'medium')
- `className?: string` - Custom CSS classes

### Theme Options
- **emerald** - Green gradient background (recommended untuk KSP)
- **blue** - Blue gradient background
- **purple** - Purple gradient background
- **gradient** - Multi-color gradient

---

## 📋 Contoh Implementasi di Screen

### Login Screen
```tsx
import { WaveBackground } from '@/components/ui/WaveBackground';

export const LoginScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-linear-to-b from-white via-emerald-50 to-white 
                    flex flex-col justify-center px-6 max-w-md mx-auto py-12 
                    relative overflow-hidden">
      <WaveBackground className="pointer-events-none" />
      
      <div className="relative z-10">
        {/* Form content */}
      </div>
    </div>
  );
};
```

### Dashboard Screen dengan Modern Background
```tsx
import { ModernBackground } from '@/components/ui/ModernBackground';

export const DashboardScreen: React.FC = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <ModernBackground 
        theme="emerald" 
        intensity="light"
      />
      
      <div className="relative z-10 p-4">
        {/* Dashboard content */}
      </div>
    </div>
  );
};
```

### Custom Combined Shapes
```tsx
import { TopWaveShape, CircleBlob, DiagonalGradient } from '@/components/ui/BackgroundShapes';

export const CustomScreen: React.FC = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <TopWaveShape className="text-emerald-50" />
      <DiagonalGradient className="opacity-30" />
      <CircleBlob size="lg" position="bottom-right" />
      
      <div className="relative z-10 p-4">
        {/* Content */}
      </div>
    </div>
  );
};
```

---

## 🎯 Best Practices

1. **Selalu gunakan `relative overflow-hidden` pada parent**
   ```tsx
   <div className="min-h-screen relative overflow-hidden">
   ```

2. **Gunakan `pointer-events-none` pada background untuk tidak mengganggu interaksi**
   ```tsx
   <WaveBackground className="pointer-events-none" />
   ```

3. **Wrap content dengan `relative z-10` agar berada di atas background**
   ```tsx
   <div className="relative z-10">
     {/* Content here */}
   </div>
   ```

4. **Gunakan `ModernBackground` untuk tampilan yang lebih polished dan modern**

5. **Sesuaikan intensity berdasarkan kebutuhan visual:**
   - **light** - Subtle, elegant
   - **medium** - Balanced (recommended)
   - **heavy** - Bold, prominent

---

## 🎨 Color Themes

### Emerald (Default - Untuk KSP/Cooperative)
- Primary: Emerald 50-200
- Best for: Financial/Cooperative apps
- Mood: Professional, trustworthy

### Blue
- Primary: Blue 50-200
- Best for: Tech/Enterprise apps
- Mood: Modern, reliable

### Purple
- Primary: Purple 50-200
- Best for: Creative/Premium apps
- Mood: Elegant, sophisticated

### Gradient
- Multi-color: Emerald + Blue blend
- Best for: Forward-thinking brands
- Mood: Dynamic, innovative

---

## ⚙️ Customization Tips

### Mengubah Warna Gradient
Edit file `ModernBackground.tsx` atau `BackgroundShapes.tsx` dan ubah warna Tailwind:
```tsx
// Ubah dari emerald ke custom color
from-[YourColor]-200 to-[YourColor]-50
```

### Mengubah Wave Shape
Edit SVG path di `BackgroundShapes.tsx`:
```tsx
<path
  fill="currentColor"
  d="M0,40 Q360,80 720,40 T1440,40 L1440,0 L0,0 Z"
  // Ubah Q360,80 untuk mengubah tinggi gelombang
  // Ubah 720,40 untuk width gelombang
/>
```

### Animasi Custom
Tambahkan ke className:
```tsx
className="animate-pulse" // Pulse effect
className="animate-bounce" // Bounce effect
// Atau buat custom animation di CSS
```

---

## 📱 Responsive

Semua komponen sudah responsive dan akan menyesuaikan dengan ukuran screen. Tidak perlu konfigurasi tambahan untuk mobile/tablet/desktop.

---

## ✅ Checklist Implementasi

- [ ] Import komponen background yang diperlukan
- [ ] Wrap screen dengan `min-h-screen relative overflow-hidden`
- [ ] Tambahkan background component tanpa `pointer-events`
- [ ] Wrap content dengan `relative z-10`
- [ ] Test di mobile, tablet, desktop
- [ ] Sesuaikan `intensity` dan `theme` sesuai kebutuhan
- [ ] Deploy! 🚀

---

**Created:** April 2026  
**Last Updated:** April 4, 2026  
**Version:** 1.0
