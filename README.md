# Requirements:
- Must use Linux or Windows Subsystem for Linux (WSL)
- Python version >= 3.11

# How to run:
1. Git clone the HandOccNet repository using `git clone https://github.com/namepllet/HandOccNet.git`. This must be done inside the PARENT directory of this `handoccnetstream` repository.
2. `cd HandOccNet` and run `pip install numpy torch torchvision einops chumpy opencv-python pycocotools pyrender tqdm`
3. Download `snapshot_demo.pth.tar` from [here](https://drive.google.com/drive/folders/1OlyV-qbzOmtQYdzV6dbQX4OtAU5ajBOa)
4. Download `MANO_LEFT.pkl` and `MANO_RIGHT.pkl` from [here](https://drive.google.com/drive/folders/106mHrHLd8Z763ClRR6c4hXyPyfxhF-hD?usp=sharing) and place both at `common/utils/manopth/mano/models` in the `HandOccNet` directory.
5. Update the chumpy package by
