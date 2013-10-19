#ifndef N_NEW_PROJECT_DIALOG_H
#define N_NEW_PROJECT_DIALOG_H

#include <QDialog>

namespace Ui {
class NNewProjectDialog;
}

class NNewProjectDialog : public QDialog
{
    Q_OBJECT

public:
    explicit NNewProjectDialog(QWidget *parent = 0);
    QString projectDirPath() const;
    ~NNewProjectDialog();

private:
    Ui::NNewProjectDialog *ui;
    QString mProjectDirPath;

private slots:
    void create();
    void showDirDialog();
};

#endif // N_NEW_PROJECT_DIALOG_H
