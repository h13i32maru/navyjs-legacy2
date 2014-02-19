#ifndef N_ABOUT_DIALOG_H
#define N_ABOUT_DIALOG_H

#include <QDialog>

namespace Ui {
class NAboutDialog;
}

class NAboutDialog : public QDialog
{
    Q_OBJECT

public:
    static QString Version;

public:
    explicit NAboutDialog(QWidget *parent = 0);
    ~NAboutDialog();

private:
    Ui::NAboutDialog *ui;
};

#endif // N_ABOUT_DIALOG_H
