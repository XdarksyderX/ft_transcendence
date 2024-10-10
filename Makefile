# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jariza-o <jariza-o@student.42malaga.com    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/09/23 23:09:08 by migarci2          #+#    #+#              #
#    Updated: 2024/10/09 09:44:25 by jariza-o         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

DOCKER := docker compose
COMPOSE_FILE := compose.yaml

all: up

up:
	$(DOCKER) -f $(COMPOSE_FILE) up --build -d 

down:
	$(DOCKER) -f $(COMPOSE_FILE) down

clean:
	$(DOCKER) -f $(COMPOSE_FILE) down --volumes --rmi all

re: down up

.PHONY: all up down re clean