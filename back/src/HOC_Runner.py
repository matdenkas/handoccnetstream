import sys
import os.path as osp
import numpy as np
import torch
import torchvision.transforms as transforms
from torch.nn.parallel.data_parallel import DataParallel
import torch.backends.cudnn as cudnn

sys.path.insert(0, osp.join('..', 'main'))
sys.path.insert(0, osp.join('..', 'common'))
from config import cfg
from model import get_model
from utils.preprocessing import load_img, generate_patch_image
from utils.vis import save_obj
from utils.mano import MANO
mano = MANO()

IS_CUDA = False

## INIT
# model snapshot load
model_path = './snapshot_demo.pth.tar'
assert osp.exists(model_path), 'Cannot find model at ' + model_path
print('Load checkpoint from {}'.format(model_path))
model = get_model('test')

if IS_CUDA:
    model = DataParallel(model).cuda()
else:
    model = DataParallel(model).cpu()

ckpt = torch.load(model_path, map_location = torch.device('cpu'))
model.load_state_dict(ckpt['network'], strict=False)
model.eval()

transform = transforms.ToTensor()


def exec_HOC(args):
    cfg.set_args(args[0])
    cudnn.benchmark = True
    
    ## PARAMS
    # hard coding
    save_dir = './'
    img_path = args[1]
    bbox = [float(args[2]), float(args[3]) , float(args[4]), float(args[5])] # xmin, ymin, width, height 


    # prepare input image
    original_img = load_img(img_path)

    # prepare bbox
    # bbox = process_bbox(bbox, original_img_width, original_img_height)
    img, img2bb_trans, bb2img_trans = generate_patch_image(original_img, bbox, 1.0, 0.0, False, cfg.input_img_shape) 
    img = transform(img.astype(np.float32))/255

    if IS_CUDA:
        img = img.cuda()[None,:,:,:]
    else:
        img = img.cpu()[None,:,:,:]

    # forward pass to the model
    inputs = {'img': img} # cfg.input_img_shape[1], cfg.input_img_shape[0], 3
    targets = {}
    meta_info = {}
    with torch.no_grad():
        out = model(inputs, targets, meta_info, 'test')
    img = (img[0].cpu().numpy().transpose(1, 2, 0)*255).astype(np.uint8) # 
    verts_out = out['mesh_coord_cam'][0].cpu().numpy()

    # save mesh (obj)
    save_path = osp.join(
        save_dir, f'{osp.basename(img_path)[:-4]}_3dmesh.obj')
    save_obj(verts_out*np.array([1, -1, -1]),
                mano.face, save_path)
    
    print("^^fin^^")


print('Processor ready!')
in_str = None
while True:
    in_str = input()
    if(in_str is not None):
        args = in_str.split()
        exec_HOC(args)
    in_str = None