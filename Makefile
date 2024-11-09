# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: migarci2 <migarci2@student.42malaga.com    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/09/23 23:09:08 by migarci2          #+#    #+#              #
#    Updated: 2024/10/13 19:49:22 by migarci2         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

COMPOSE_FILE := compose.yaml

all: up

up:
	docker compose -f $(COMPOSE_FILE) up -d --build

down:
	docker compose -f $(COMPOSE_FILE) down

dev:
	docker compose -f $(COMPOSE_FILE) up --build

clean:
	docker compose -f $(COMPOSE_FILE) down --volumes --rmi all

re: down up

.PHONY: all up down re clean