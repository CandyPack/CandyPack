## 🎛️ GPU Reservation

AI workloads need the host's accelerator, not just its CPU. Ready-made AI apps installed from the Cloud arrive with their GPU reservation already attached, and `odac app gpu` is the same field for everything else: an app you created yourself, one that started on the CPU and outgrew it, or one whose reservation you want to resize or give back.

### Usage

```bash
# Reserve the GPU this host has (vendor auto-detected)
odac app gpu my-app

# Name the runtime explicitly
odac app gpu my-app --nvidia
odac app gpu my-app --amd
odac app gpu my-app --intel

# Reserve part of a multi-GPU host
odac app gpu my-app --nvidia --count 2

# Release the reservation, back to CPU
odac app gpu my-app --off
```

### Available Prefixes
- `-i`, `--id`: The App ID or Name
- `--nvidia`, `--amd`, `--intel`: The runtime to reserve. Omit them and ODAC uses the card it detected on this host
- `--count`: How many devices to reserve (default: all of them)
- `--off`: Release the reservation

> ⚠️ **Important:** A container's device requests are fixed when it is created, so the change takes effect on the next start. **Restart** the application afterwards:
> ```bash
> odac app restart my-app
> ```

### The Host Pre-Flight

The reservation is checked against this host before it is stored, the same check `odac app create` runs. A host with an NVIDIA driver but no `nvidia-container-toolkit` has real hardware that no container can be handed, so the command refuses with the missing piece named instead of storing a reservation that would fail every start from then on:

```
This host cannot pass an NVIDIA GPU to a container: the NVIDIA container
runtime is not registered with Docker. Install nvidia-container-toolkit and
run `nvidia-ctk runtime configure --runtime=docker`, then restart Docker.
```

ROCm and Intel need no engine support, only the host's driver nodes (`/dev/kfd`, `/dev/dri`), and the refusal names those instead.

`--off` skips the pre-flight entirely. An app that was created with a reservation must always be able to go back to the CPU, including on a host that has since lost its card.

### What the Host Reports

`odac info` (system.info) carries the host's own answer:

- **runtime**: the kind of working card present, `null` when there is none
- **schedulable**: whether the container engine can actually hand it to a container
- **reason**: which piece is missing, `null` when schedulable

A bare `odac app gpu my-app` reserves whatever **runtime** reports. If ODAC cannot see the card from inside its own container the command says so, and naming the vendor explicitly (or setting `ODAC_GPU_RUNTIME`) is the way through.

### Notes

- Reserving a GPU is orthogonal to [Network Mode](06-network-mode.md) and [Network Isolation](07-network-isolation.md). An isolated app can still hold a GPU.
- The reservation is stored in the app's config and echoed back in `odac app list`, so the Cloud sees the same shape it sends at create time.
- ROCm and Intel containers also receive the host's render group ids, so an image that does not run as root can still open the device nodes.
