import os
import medmnist
from medmnist import INFO
from PIL import Image

output_dir = "test_samples"
os.makedirs(output_dir, exist_ok=True)

def extract_images(data_flag, organ_name):
    print(f"📸 Extracting {organ_name}...")
    try:
        info = INFO[data_flag]
        DataClass = getattr(medmnist, info['python_class'])
        dataset = DataClass(split='test', download=True)
        
        for i in range(5): # Save 5 samples per organ
            img, target = dataset[i]
            label_id = int(target)
            label_name = info['label'][str(label_id)].replace(" ", "_").replace("/", "-")
            
            filename = f"{organ_name}_{i}_{label_name}.jpg"
            img = img.resize((224, 224), Image.NEAREST)
            img.save(os.path.join(output_dir, filename))
            print(f"  Saved: {filename}")
    except Exception as e:
        print(f"  ⚠️ Error: {e}")

if __name__ == "__main__":
    print("🚀 Generating Test Samples for Full Body Scanner...")
    
    # Original 3
    extract_images('pneumoniamnist', 'lungs')
    extract_images('dermamnist', 'skin')
    extract_images('organamnist', 'abdomen')
    
    # New 4
    extract_images('retinamnist', 'eyes')
    extract_images('bloodmnist', 'blood')
    extract_images('breastmnist', 'breast')
    extract_images('pathmnist', 'pathology')
    
    print(f"\n✅ Done! Check the '{output_dir}' folder.")