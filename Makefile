# **************************************************************************** #
#                                                                              #
#                                                         					   #
#    Makefile                                           				       #
#                                                     					       #
#    By: jariza-o <juanarizaordonez@gmail.com>    					           #
#                                                 				               #
#    Created: 2024/09/17 17:52:35 by jariza-o          			               #
#    Updated: 2024/09/17 17:52:36 by jariza-o         				           #
#                                                                              #
# **************************************************************************** #

all:
	@docker compose up --build -d
down:
	@docker compose down
stop:
	@docker compose stop
start:
	@docker compose start
clean: down
	@docker system prune
clean_all: down
	@docker system prune -a
clean_volumes: down
	@docker volume rm $$(docker volume ls -q)

.PHONY: all down clean clean_all clean_volumes