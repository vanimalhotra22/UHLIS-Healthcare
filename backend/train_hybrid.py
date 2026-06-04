import torch
import torch.nn as nn
import torch.optim as optim
import medmnist
from medmnist import INFO
import torchvision.transforms as transforms
from torchvision import datasets, models
from torch.utils.data import DataLoader
import os
import sys

# Use CPU for stability (Change to "cuda" if you have NVIDIA GPU setup)
device = torch.device("cpu") 

def get_model_architecture(n_classes, n_channels):
    model = models.resnet18(pretrained=True)
    if n_channels == 1:
        model.conv1 = nn.Conv2d(1, 64, kernel_size=7, stride=2, padding=3, bias=False)
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, n_classes)
    return model.to(device)

def train_loop(model, loader, name):
    print(f"   🚀 Training {name}...")
    model.train()
    optimizer = optim.SGD(model.parameters(), lr=0.001, momentum=0.9)
    criterion = nn.CrossEntropyLoss()
    
    # Fast Demo Mode: Train 50 batches only
    max_batches = 50
    for i, (inputs, targets) in enumerate(loader):
        if i >= max_batches: break
        inputs, targets = inputs.to(device), targets.to(device)
        if targets.dim() > 1: targets = targets.squeeze().long()
        
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()
        
        if i % 10 == 0: print(f"      Batch {i}/{max_batches} | Loss: {loss.item():.4f}")

    os.makedirs("models", exist_ok=True)
    save_path = f"models/{name}.pth"
    torch.save(model.state_dict(), save_path)
    print(f"   ✅ Saved: {save_path}\n")

def train_medmnist(data_flag, save_name):
    print(f"⬇️  Preparing {save_name} ({data_flag})...")
    try:
        info = INFO[data_flag]
        DataClass = getattr(medmnist, info['python_class'])
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[.5], std=[.5])
        ])
        train_dataset = DataClass(split='train', transform=transform, download=True)
        loader = DataLoader(dataset=train_dataset, batch_size=32, shuffle=True)
        model = get_model_architecture(len(info['label']), info['n_channels'])
        train_loop(model, loader, save_name)
    except Exception as e:
        print(f"❌ Error training {save_name}: {e}")

def train_local(folder_path, save_name):
    print(f"📂 Preparing {save_name} from Local Folder...")
    if not os.path.exists(folder_path):
        print(f"❌ Missing folder: {folder_path}")
        return
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    try:
        dataset = datasets.ImageFolder(folder_path, transform)
        loader = DataLoader(dataset, batch_size=32, shuffle=True)
        model = get_model_architecture(len(dataset.classes), 3)
        train_loop(model, loader, save_name)
    except Exception as e:
        print(f"❌ Failed to load local images: {e}")

if __name__ == "__main__":
    print("\n🧠 INITIALIZING MEGA-MEDICAL AI FACTORY\n")
    
    # --- GROUP A: EXISTING SPECIALISTS ---
    train_medmnist('pneumoniamnist', 'lungs_net')
    train_medmnist('dermamnist', 'skin_net')
    train_medmnist('organamnist', 'abdomen_net')

    # --- GROUP B: NEW SPECIALISTS (The Expansion) ---
    train_medmnist('retinamnist', 'retina_net')    # Eyes
    train_medmnist('bloodmnist', 'blood_net')      # Blood Cells
    train_medmnist('breastmnist', 'breast_net')    # Breast
    train_medmnist('pathmnist', 'pathology_net')   # Colon Pathology

    # --- GROUP C: LOCAL FOLDERS (Your Downloaded Data) ---
    train_local(os.path.join('data', 'brain', 'Training'), 'brain_net') 
    train_local(os.path.join('data', 'bone', 'Bone Fracture Dataset', 'training'), 'bone_net')
    
    print("\n🎉 ALL 9 SPECIALISTS TRAINED! Run 'uvicorn main:app --reload'.")