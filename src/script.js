/*
ToDo:
- Custom shape, text, emogi, image.
    Be able to have several and they random pick one.
- What speed, how often
- What direction, fixed like center, top, bottom or custom?
    - Mouse move?
 
- Another setting for mobile?
- Use same canvas with different settings?

- Fix image origin to center
- Fix image size to be different?
*/

(function () {
  /*const sharedState = {
    canvas: null,
    ctx: null
  };
  
  const initCanvas = (canvasSelector) => {
    const canvas = document.querySelector(canvasSelector);
    if (!canvas) {
      throw new Error('particleQuest: No canvas found');
    }
    const ctx = canvas.getContext('2d');
    sharedState.canvas = canvas;
    sharedState.ctx = ctx;
  };*/

  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        resolve(img);
      };
      img.onerror = () => {
        reject('particleQuest: Something wrong with the image url');
      };
    });
  };

  window.particleQuest = function (config) {
    const settings = {
      maxParticleSize: config.maxParticleSize || 200,
      speed: config.speed || 200,
      speedToEndDirection: config.speedToEndDirection || 100,
      maxParticles: config.maxParticles || 8000,
      particleOffset: config.particleOffset || 300, // Maybe a max and min offset
      fps: config.fps || 600,
      urlImages: config.urlImages || [],
      textParticles: config.textParticles || ['🤪', '😇'],
      circleParticles: config.circleParticles || false,
    };

    // initCanvas(config.canvasSelector);

    const canvas = document.querySelector(config.canvasSelector);
    if (!canvas) {
      throw new Error('particleQuest: No canvas found');
    }
    const ctx = canvas.getContext('2d');

    let loadedImages = [];
    let particleId = 0;

    //const canvas = sharedState.canvas
    //const ctx = sharedState.ctx

    canvas.width = Math.round(canvas.clientWidth * devicePixelRatio);
    canvas.height = Math.round(canvas.clientHeight * devicePixelRatio);

    const centerOfScreen = () => {
      return {
        x: canvas.width / 2,
        y: canvas.height / 2,
      };
    };

    const randomPos = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

    const loadImages = async () => {
      loadedImages = await Promise.all(
        settings.urlImages.map(async (url) => {
          return await loadImage(url);
        })
      );
      afterImagesLoaded();
    };

    const createTextCanvas = (text) => {
      const textCanvas = document.createElement('canvas');
      const textCtx = textCanvas.getContext('2d');
      textCanvas.width = settings.maxParticleSize;
      textCanvas.height = settings.maxParticleSize;

      textCtx.font = `${settings.maxParticleSize / 2}px Arial`;
      textCtx.fillText(text, settings.maxParticleSize / 6, settings.maxParticleSize / 1.5);

      return textCanvas;
    };

    const loadTextCanvas = async () => {
      if (typeof settings.textParticles === 'string') {
        settings.textParticles = [settings.textParticles];
      }
      loadedImages = await settings.textParticles.map((text) => {
        return createTextCanvas(text);
      });
      afterImagesLoaded();
    };

    // Check in config if urlImages or textParticles is set
    if (config.urlImages) {
      loadImages();
    } else {
      loadTextCanvas();
    }

    const afterImagesLoaded = () => {
      startAnimation(settings.fps);
    };

    // canvas.addEventListener('mousemove', (e) => {
    //     console.log('move: ',e.clientX, e.clientY);
    //     centerOfScreen = () => {
    //         return {
    //             x: e.clientX,
    //             y: e.clientY,
    //         };
    //     };
    // })

    // Resize logic
    const resizeObserver = new ResizeObserver((entries) => {
      // This to prevent error "Uncaught ResizeObserver loop completed with undelivered notifications."
      for (let entry of entries) {
        setTimeout(() => {
          canvas.width = Math.round(canvas.clientWidth * devicePixelRatio);
          canvas.height = Math.round(canvas.clientHeight * devicePixelRatio);
        }, 0);
      }
      /*if (innerWidth < 1200) {
        settings.speedToEndDirection = 5;
      }*/
    });

    resizeObserver.observe(canvas);

    const randomPosition = () => {
      return {
        x: randomPos(-settings.particleOffset, canvas.width + settings.particleOffset),
        y: randomPos(-settings.particleOffset, canvas.height + settings.particleOffset),
      };
    };

    function Circle(size) {
      this.circlePos = randomPosition();
      if (size) {
        this.size = size;
      } else {
        this.size = particleSize(this.circlePos);
      }
      this.minus = this.size / settings.speed;
      this.particleId = particleId++;
      this.color = changeColor(this.size);
      this.draw = () => {
        this.size = this.size - this.minus;
        if (this.size <= 0) {
          removeParticle(this.particleId);
          return;
        }
        const direction = whatDirection(this.circlePos);
        this.circlePos.y = direction.y;
        this.circlePos.x = direction.x;
        ctx.beginPath();

        ctx.arc(this.circlePos.x, this.circlePos.y, this.size, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
      };
    }

    function ImagePart(size) {
      this.imagePos = randomPosition();
      if (size) {
        this.size = size;
      } else {
        this.size = particleSize(this.imagePos);
      }
      this.minus = this.size / settings.speed;
      this.particleId = particleId++;

      this.image = loadedImages[randomPos(0, loadedImages.length - 1)];

      this.draw = () => {
        this.size = this.size - this.minus;
        if (this.size <= 0) {
          removeParticle(this.particleId);
          return;
        }
        const direction = whatDirection(this.imagePos);
        this.imagePos.y = direction.y;
        this.imagePos.x = direction.x;

        const halfSize = this.size / 2;
        ctx.drawImage(this.image, this.imagePos.x - halfSize, this.imagePos.y - halfSize, this.size, this.size);
      };
    }

    const changeColor = () => {
      const test = randomPos(0, 200);
      const r = test;
      const g = test;
      const b = test;
      return `rgb(${r}, ${g}, ${b})`;
    };

    const particleSize = (position) => {
      const total = centerOfScreen().x + centerOfScreen().y;
      return (
        (Math.sqrt((position.x - centerOfScreen().x) ** 2 + (position.y - centerOfScreen().y) ** 2) / total) *
        settings.maxParticleSize
      );
    };

    const whatDirection = ({ ...position }) => {
      let { x, y } = position;

      const frames = settings.speedToEndDirection;
      const distanceY = y - centerOfScreen().y;
      y = y - distanceY / frames;

      const distanceX = x - centerOfScreen().x;
      x = x - distanceX / frames;

      return { x, y };
    };

    const removeParticle = (particleId) => {
      if (group.length <= 1) {
        group.pop();
      } else {
        group = group.filter((each) => each.particleId !== particleId);
      }
    };

    let group = [];

    const startAnimation = (fps = 60) => {
      const interval = 1000 / fps; // ?? Workign?
      let lastTime = 0;

      const animate = (time) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < group.length; i++) {
          group[i].draw(ctx);
        }

        if (time - lastTime >= interval) {
          if (group.length < settings.maxParticles) {
            let particle = new ImagePart();
            if (settings.circleParticles) {
              particle = new Circle();
            }
            group.push(particle);
          }
          lastTime = time;
        }
        animationFrameId = requestAnimationFrame(animate);
      };
      animationFrameId = requestAnimationFrame(animate);
    };
  };
})();

/*  Replaced by images due to performance
    function TextPart(size) {
      this.textPos = randomPosition();
      if (size) {
        this.size = size
      } else {
        this.size = particleSize(this.textPos)
      }
      this.minus = this.size / speed;
      this.particleId = particleId++;
 
      this.text = textParticles[randomPos(0, textParticles.length - 1)];
 
      this.draw = (ctx2) => {
        this.size = this.size - this.minus;
        if (this.size <= 0) {
          removeParticle(this.particleId);
          return;
        }
        const direction = whatDirection(this.textPos);
        this.textPos.y = direction.y;
        this.textPos.x = direction.x;
 
        ctx2.font = `${this.size}px Arial`;
        ctx2.fillText(this.text, this.textPos.x, this.textPos.y);
      };
    }*/
