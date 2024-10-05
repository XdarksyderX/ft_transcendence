# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: migarci2 <migarci2@student.42malaga.com    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/09/23 23:09:08 by migarci2          #+#    #+#              #
#    Updated: 2024/09/23 23:09:28 by migarci2         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

COMPOSE_FILE := compose.yaml

all: up

up:
	docker-compose -d -f $(COMPOSE_FILE) up --build

down:
	docker-compose -f $(COMPOSE_FILE) down

clean:
	docker-compose -f $(COMPOSE_FILE) down --volumes --rmi all

re: down up

.PHONY: all up down re clean