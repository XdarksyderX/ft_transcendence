# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: migarci2 <migarci2@student.42malaga.com    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/08/29 16:03:17 by migarci2          #+#    #+#              #
#    Updated: 2024/08/29 18:16:58 by migarci2         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FROM python3:3.11-slim

WORKDIR /service

COPY service /service

RUN pip install --no-cache-dir -r requirements.txt

RUN apt-get update && apt-get install -y postgresql postgresql-contrib

EXPOSE 5000

CMD service postgresql start && python manage.py migrate && python manage.py runserver 0.0.0.0:5000