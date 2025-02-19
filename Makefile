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

up: prepare
	docker compose -f $(COMPOSE_FILE) up -d --build

down:
	docker compose -f $(COMPOSE_FILE) down

dev: prepare
	docker compose -f $(COMPOSE_FILE) up --build

clean:
	docker compose -f $(COMPOSE_FILE) down --volumes --rmi all
	rm -rf auth/service/config/keys
	rm -rf social/service/config/keys
	rm -rf pong/service/config/keys
	rm -rf chess/service/config/keys
	rm -rf events/service/config/keys
	rm -f private.pem
	rm -f public.pem

prepare: keys
	mkdir -p volume-data/ volume-data/auth volume-data/social volume-data/pong volume-data/chess

keys:
	@if [ ! -f private.pem ]; then openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048; fi
	@if [ ! -f public.pem ]; then openssl rsa -pubout -in private.pem -out public.pem; fi

	mkdir -p auth/service/config/keys social/service/config/keys pong/service/config/keys chess/service/config/keys events/service/config/keys

	cp private.pem auth/service/config/keys/private.pem

	cp public.pem auth/service/config/keys/public.pem
	cp public.pem social/service/config/keys/public.pem
	cp public.pem pong/service/config/keys/public.pem
	cp public.pem chess/service/config/keys/public.pem
	cp public.pem events/service/config/keys/public.pem


re: down up

.PHONY: all up down re clean