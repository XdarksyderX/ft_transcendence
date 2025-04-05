# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jariza-o <jariza-o@student.42malaga.com    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/08/29 16:03:17 by migarci2          #+#    #+#              #
#    Updated: 2025/04/05 08:19:36 by jariza-o         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FROM python:3.11-bookworm

RUN apt-get update && apt-get install -y postgresql postgresql-contrib sudo

COPY service /service

RUN pip install --no-cache-dir -r /service/requirements.txt

EXPOSE 5051

COPY entrypoint.sh /entrypoint.sh
COPY dropdb.sh /dropdb.sh

RUN chmod +x /entrypoint.sh
RUN chmod +x /dropdb.sh

CMD ["/bin/bash", "/entrypoint.sh"]