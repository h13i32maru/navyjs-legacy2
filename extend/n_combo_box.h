#ifndef N_COMBO_BOX_H
#define N_COMBO_BOX_H

#include <QComboBox>
#include "extend/n_completer.h"

class NComboBox : public QComboBox
{
    Q_OBJECT
public:
    explicit NComboBox(QWidget *parent = 0);
    void setList(const QStringList &list);

signals:

public slots:

private:
    NCompleter *mCompleter;
};

#endif // N_COMBO_BOX_H
