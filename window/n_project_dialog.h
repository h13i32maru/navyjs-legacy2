#ifndef N_PROJECT_DIALOG_H
#define N_PROJECT_DIALOG_H

#include <QDialog>

namespace Ui {
class NProjectDialog;
}

class NProjectDialog : public QDialog
{
    Q_OBJECT

public:
    explicit NProjectDialog(QWidget *parent = 0);
    ~NProjectDialog();

private:
    Ui::NProjectDialog *ui;
};

#endif // N_PROJECT_DIALOG_H
