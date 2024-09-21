### [OpenCL Headers](https://cn.khronos.org/opencl/),mesa,vulkan and microcode packages:

```bash
sudo apt-get -y install ocl-icd-opencl-dev opencl-headers mesa-common-dev mesa-opencl-icd mesa-utils-extra clinfo libvulkan1 mesa-vulkan-drivers vulkan-utils amd64-microcode intel-microcode iucode-tool thermald gdebi-core
```

### [Vulkan SDK](https://www.lunarg.com/vulkan-sdk/)

```bash
sudo wget -qO - https://packages.lunarg.com/lunarg-signing-key-pub.asc | sudo apt-key add -
&& sudo wget -qO /etc/apt/sources.list.d/lunarg-vulkan-1.2.189-focal.list https://packages.lunarg.com/vulkan/1.2.189/lunarg-vulkan-1.2.189-focal.list
&& sudo apt update
&& sudo apt install vulkan-sdk
```

### Resources:
* [WebGL](https://askubuntu.com/questions/299345/how-to-enable-webgl-in-chrome-on-ubuntu#299346)
* [WebGl-Utils](https://webglfundamentals.org/docs/module-webgl-utils.html)
* [Fundamentals](https://webglfundamentals.org/webgl/lessons/webgl-setup-and-installation.html)
* [WebCL](https://www.khronos.org/api/webcl)
