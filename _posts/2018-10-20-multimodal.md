---
layout: post
title: What is multi-modal learning?
date: 2020-10-20 20:59:00-0400
description: an introduction of multi-modal learning
comments: true
categories: sample-posts machine-learning AI
---
## Multimodal Machine Learning - Overview

The world surrounding us involves multiple modalities – we see objects, hear sounds, feel texture, smell odors, and so on. In general terms, a modality refers to the way in which something happens or is experienced. Most people associate the word modality with the sensory modalities which represent our primary channels of communication and sensation, such as vision or touch. A research problem or dataset is therefore characterized as multimodal when it includes multiple such modalities. In order for Artificial Intelligence (AI) to make progress in understanding the world around us, it needs to be able to interpret and reason about multimodal messages. Multimodal machine learning aims to build models that can process and relate information from multiple modalities.
<br/>

The emerging field of multimodal machine learning has seen much progress in the past few years. The core challenges are multiple: representation with the goal to learn computer interpretable descriptions of heterogenous data from multiple modalities, translation which represents the process of changing data from one modality to another, alignment where we want to identify relations between elements from two or more different modalities, fusion which represents the process of joining information from two or more modalities to perform a prediction task, and finally co-learning with the goal of transferring knowledge between modalities and their representations.
<br/>

The research field of Multimodal Machine Learning brings some unique challenges for computational researchers given the heterogeneity of the data. Learning from multimodal sources offers the possibility of capturing correspondences between modalities and gaining an in-depth understanding of natural phenomena. In our work, we identify and explore five core technical challenges (and related sub-challenges) surrounding multimodal machine learning. They are central to the multimodal setting and need to be tackled to progress the field. As of the taxonomy of Multimodal Machine Learning, current taxonomy goes beyond the typical early and late fusion split, and consists of the five following challenges:
<br/>

Representation: A first fundamental challenge is learning how to represent and summarize multimodal data in a way that exploits the complementarity and redundancy of multiple modalities. The heterogeneity of multimodal data makes it challenging to construct such representations. For example, language is often symbolic while audio and visual modalities will be represented as signals.
<br/>

Translation: A second challenge addresses how to translate (map) data from one modality to another. Not only is the data heterogeneous, but the relationship between modalities is often open-ended or subjective. For example, there exist some correct ways to describe an image, and one perfect translation may not exist.
<br/>

Alignment: A third challenge is to identify the direct relations between (sub)elements from two or more different modalities. For example, we may want to align the steps in a recipe to a video showing the dish being made. To tackle this challenge we need to measure the similarity between different modalities and deal with possible long-range dependencies and ambiguities.
<br/>

Fusion: A fourth challenge is to join information from two or more modalities to perform a prediction. For example, for audio-visual speech recognition, the visual description of the lip motion is fused with the speech signal to predict spoken words. The information coming from different modalities may have different predictive power and noise topology, with possibly missing data in at least one of the modalities.
<br/>

Co-learning: The fifth challenge is to transfer knowledge between modalities, their representation, and their predictive models. This area of work is exemplified by algorithms of co-training, conceptual grounding, and zero shot learning. Co-learning explores how knowledge learning from one modality can help a computational model trained on a different modality. This challenge is particularly relevant when one of the modalities has limited resources (e.g., annotated data).
<br/>

##