rivate void button1_MouseEnter(object sender, EventArgs e)
        {
            //Создаём новый экземпляр генератора псевдослучайных чисел
            Random rnd = new Random();
            //Спавним кнопку на случайной позиции
            button1.Location = new Point(
                rnd.Next(0, this.ClientSize.Width - 25),
                rnd.Next(0, this.ClientSize.Height - 25));
        }