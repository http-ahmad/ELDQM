**ELDQM: Emergency Leakage and Dispersion Selection Model**
ELDQM is an atmospheric dispersion modeling framework designed to simulate the transport and spread of hazardous chemical releases. It provides a transparent, computationally efficient environment for emergency response analysis, sensitivity studies, and comparative evaluation against established tools like ALOHA.

🌟 Key Features
Gaussian Dispersion: Standard plume formulation for steady-state analysis.

Health Hazard Mapping: Integrated AEGL-1, -2, and -3 threshold zoning.

Atmospheric Stability: Full support for Pasquill–Gifford (A–F) classifications.

Performance Metrics: Built-in validation tools including RMSE, Mean Bias (MB), Fractional Bias (FB), and Index of Agreement (IOA).

Adaptive Resolution: Optimized spatial grids to ensure high accuracy near the source without sacrificing performance.

🔬 Model Assumptions
To ensure computational efficiency for screening-level assessments, the model assumes:

Flat Terrain: No complex topography or building-induced wake effects.

Steady State: Constant meteorological conditions during the simulation.

Continuous Release: Modeled as a steady-state vapor plume from ground-level or point sources.

Neutral Background: Zero initial concentration of the hazardous substance in the environment.

🛠 Installation
Bash

# Clone the repository
git clone https://github.com/yourlink/eldqm.git

# Enter the directory
cd eldqm

# Install requirements
pip install -r requirements.txt
📋 Quick Start
Python

from eldqm import Model

# Initialize model (Wind: 3m/s, Stability: Class C)
model = Model(wind_speed=3.0, stability='C')

# Define a 100 g/s chlorine release
model.run_simulation(source_rate=100, substance='Chlorine')

# View results
model.show_hazard_zones()
🗺 Roadmap
GIS Integration: Overlapping hazard plumes with real-world maps and population data.

Transient Modeling: Development of "Puff" models for instantaneous releases.

Urban Effects: Integration of building downwash and obstacle algorithms.

⚖️ License
This project is released under an open-source license for academic and research use.
