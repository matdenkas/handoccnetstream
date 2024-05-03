# Requirements:
- Must use Linux or Windows Subsystem for Linux (WSL)
- Python version >= 3.11

# How to run: 
1. Clone this repository to your host OS
2. In WSL, Git clone the HandOccNet repository using `git clone https://github.com/namepllet/HandOccNet.git`. This must be done inside the PARENT directory of this `handoccnetstream` repository.
3. IN WSL, `cd HandOccNet` and run `pip install numpy torch torchvision einops chumpy opencv-python pycocotools pyrender tqdm`
4. Download `snapshot_demo.pth.tar` from [here](https://drive.google.com/drive/folders/1OlyV-qbzOmtQYdzV6dbQX4OtAU5ajBOa)
5. Download `MANO_LEFT.pkl` and `MANO_RIGHT.pkl` from [here](https://drive.google.com/drive/folders/106mHrHLd8Z763ClRR6c4hXyPyfxhF-hD?usp=sharing) and place both at `common/utils/manopth/mano/models` in the `HandOccNet` directory.
6. Update the chumpy package by copying the ch.py file from this repo to `.local/lib/python3.10/site-packages/chumpy`
7. In host OS `npm run server`, if you see the message `child process spawned` everything is set up right!
