#ifndef N_TEXT_DIALOG_H
#define N_TEXT_DIALOG_H

#include <QDialog>

namespace Ui {
class NTextDialog;
}

class NTextDialog : public QDialog
{
    Q_OBJECT

public:
    explicit NTextDialog(QWidget *parent = 0);
    void setText(QString text);
    ~NTextDialog();

private:
    Ui::NTextDialog *ui;
};

#endif // N_TEXT_DIALOG_H
