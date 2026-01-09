ELDQM

Emergency Leakage and Dispersion Selection Model

Overview

ELDQM is an atmospheric dispersion modeling framework developed to simulate the transport and spread of hazardous chemical releases resulting from accidental leakages in industrial and urban environments. The model is intended for emergency response analysis, sensitivity and robustness studies, and comparative evaluation against established dispersion tools under controlled and reproducible conditions.

The framework focuses on transparency, computational efficiency, and scientific consistency, making it suitable for academic research, teaching, and preliminary risk assessment applications.

Key Features

Simulation of continuous vapor releases from ground-level point sources

Support for both single-source and multi-source release scenarios

Gaussian-based dispersion formulation

Pasquill–Gifford atmospheric stability classification (A–F)

Health-based hazard zoning using AEGL-1, AEGL-2, and AEGL-3 thresholds

Quantitative performance metrics: RMSE, Mean Bias (MB), Fractional Bias (FB), and Index of Agreement (IOA)

Adaptive spatial resolution to optimize runtime while preserving near-field accuracy

Designed for direct comparison with reference models such as ALOHA

Model Assumptions

Flat terrain with no complex topographic or building wake effects

Neutral background concentration

Steady-state meteorological conditions during each simulation

Continuous release unless otherwise specified

Applications

Emergency preparedness and response planning

Sensitivity and robustness analysis of dispersion behavior

Educational demonstrations of atmospheric dispersion principles

Comparative benchmarking of dispersion models

Limitations

Does not currently account for complex terrain or building-induced flow effects

Chemical transformation and deposition processes are not included

Intended for screening-level and research use, not regulatory compliance

Future Work

Integration of complex terrain and building effects

Extension to transient puff-based modeling

GIS-based population exposure assessment

Enhanced visualization and reporting capabilities

License

This project is released under an open-source license for academic and research use.
